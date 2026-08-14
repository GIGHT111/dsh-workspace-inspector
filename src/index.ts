/**
 * dsh-workspace-inspector — host 半面。
 *
 * 注册三个 webserver 精确路由：
 *   1. GET /__dsh-workspace-inspector/list?path=<abs>
 *      返回该目录的一层条目（目录 + 文件，含 size / hidden 标记）。浏览器
 *      client 用它懒加载工作区文件树。
 *   2. GET /__dsh-workspace-inspector/outline?session=<id>
 *      重放该会话的完整持久化事件日志，提炼「消息目录」：每次用户消息的
 *      文本摘要、时间、其后的 assistant 回复摘要与工具调用次数。客户端事件
 *      窗口只有最近若干消息，完整目录只能由 host 从日志重建。
 *   3. GET /__dsh-workspace-inspector/open?path=<abs>
 *      用系统默认应用打开目标文件/目录（macOS open / Windows Invoke-Item /
 *      Linux xdg-open），与官方 host.openPath 同一机制，但走插件自有路由，
 *      便于端到端验证与显式报错。
 *
 * 安全：list/open 仅允许 host cwd 或已注册 workspace 根之下的绝对路径
 * （Windows 大小写不敏感比较）；所有路由响应均 Cache-Control: no-store；
 * 所有失败转为明确的 4xx/5xx JSON。
 */
import { execFile } from 'node:child_process'
import { readdir, stat } from 'node:fs/promises'
import { basename, isAbsolute, join, resolve, sep } from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
// Type-only：拉入 webServer / workspaceRegistry / sessions 的 Context augmentation。
import type {} from '@deepseek-ai/dsh-host-webserver'
import type {} from '@deepseek-ai/dsh-workspace'
import type {} from '@deepseek-ai/dsh-session'

export const name = 'dsh-workspace-inspector'

export const inject = ['webServer', 'sessions']

export interface Config {
  /** 单层目录最多返回的条目数；超出截断并置 truncated。 */
  maxEntriesPerDir: number
}

export const Config: z<Config> = z.object({
  maxEntriesPerDir: z.natural().min(1).max(100000).default(1000),
})

const LIST_ROUTE = '/__dsh-workspace-inspector/list'
const OUTLINE_ROUTE = '/__dsh-workspace-inspector/outline'
const OPEN_ROUTE = '/__dsh-workspace-inspector/open'

interface TreeEntry {
  name: string
  path: string
  kind: 'dir' | 'file'
  /** 文件字节数；目录恒缺省。 */
  size?: number
  /** 宿主平台约定隐藏（POSIX 点前缀）。 */
  hidden: boolean
}

interface ListPayload {
  path: string
  name: string
  entries: TreeEntry[]
  truncated: boolean
}

/** 消息目录条目（host 侧重建，含完整历史）。 */
export interface OutlineEntryData {
  /** user/message 事件的 message id；client 据此计算 chat 节点 key。 */
  messageId: string
  /** 事件时间（epoch ms）。 */
  time: number
  /** 用户消息文本摘要（去空白、截断）。 */
  summary: string
  /** 其后 assistant 回复文本摘要（截断）。 */
  reply: string
  /** 该轮工具调用次数。 */
  toolCount: number
}

interface ErrorPayload {
  error: { code: string; message: string }
}

function sendJson(res: ServerResponse, status: number, payload: object, envelope = false): void {
  const body = envelope ? JSON.stringify({ entries: payload }) : JSON.stringify(payload)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  })
  res.end(body)
}

/**
 * 允许的根目录集合：host cwd（默认工作区根）加上所有已注册 workspace 的规范
 * 路径。workspaceRegistry 为可选服务（ctx.get），缺席时退化为仅 cwd。
 */
function allowedRoots(ctx: Context): string[] {
  const roots = [process.cwd()]
  const registry = ctx.get('workspaceRegistry') as
    | { list(): readonly { path: string }[] }
    | undefined
  if (registry !== undefined) {
    for (const workspace of registry.list()) roots.push(resolve(workspace.path))
  }
  return roots
}

/**
 * 路径比较键：Windows 文件系统大小写不敏感，比较前统一小写；POSIX 保持原样。
 */
function pathKey(p: string): string {
  return process.platform === 'win32' ? p.toLowerCase() : p
}

function isInside(target: string, roots: readonly string[]): boolean {
  const t = pathKey(target)
  return roots.some((root) => {
    const r = pathKey(root)
    return t === r || t.startsWith(r + sep)
  })
}

async function listLevel(ctx: Context, config: Config, target: string): Promise<ListPayload> {
  const dirents = await readdir(target, { withFileTypes: true })
  const sorted = [...dirents].sort((a, b) => {
    const aDir = a.isDirectory() || a.isSymbolicLink() ? 0 : 1
    const bDir = b.isDirectory() || b.isSymbolicLink() ? 0 : 1
    if (aDir !== bDir) return aDir - bDir
    return a.name.localeCompare(b.name)
  })

  const entries: TreeEntry[] = []
  let truncated = false
  for (const dirent of sorted) {
    if (entries.length >= config.maxEntriesPerDir) {
      truncated = true
      break
    }
    const entryPath = join(target, dirent.name)
    const isDir = dirent.isDirectory() || (dirent.isSymbolicLink() ? (await stat(entryPath)).isDirectory() : false)
    const row: TreeEntry = {
      name: dirent.name,
      path: entryPath,
      kind: isDir ? 'dir' : 'file',
      hidden: dirent.name.startsWith('.'),
    }
    if (!isDir) {
      try {
        row.size = (await stat(entryPath)).size
      } catch {
        // 竞争删除等：保留条目但无 size。
      }
    }
    entries.push(row)
  }
  return { path: target, name: basename(target), entries, truncated }
}

/** 提取事件 content 中的纯文本并拼接（与 client 展示口径一致）。 */
function extractText(content: readonly { type?: string; text?: string }[] | undefined): string {
  if (content === undefined) return ''
  const parts: string[] = []
  for (const block of content) {
    if (block?.type === 'text' && typeof block.text === 'string') parts.push(block.text)
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim()
}

const SUMMARY_LIMIT = 48
const REPLY_LIMIT = 96

/** user/message 与后续事件的最小结构。 */
interface UserMessageEventLike {
  type: 'user/message'
  time: number
  data: {
    id: unknown
    content?: readonly { type?: string; text?: string }[]
    source?: { kind?: string }
  }
}

interface AssistantMessageEventLike {
  type: 'assistant/message'
  data: { message?: { content?: readonly { type?: string; text?: string }[] } }
}

interface ToolCallEventLike {
  type: 'tool/call'
}

/**
 * 重放会话事件日志，重建完整消息目录：每条 source.kind === 'user' 的
 * user/message 构成一条目录项；其后的 assistant/message 文本并入回复摘要，
 * tool/call 计入工具次数，直到下一条用户消息。
 */
export function buildOutline(events: readonly unknown[]): OutlineEntryData[] {
  const entries: OutlineEntryData[] = []
  let current: OutlineEntryData | undefined
  for (const raw of events) {
    const event = raw as UserMessageEventLike | AssistantMessageEventLike | ToolCallEventLike | { type: string }
    if (event.type === 'user/message') {
      const userEvent = event as UserMessageEventLike
      // 任何用户消息事件（含 context 注入、轮中转交）都终结上一轮的回复累积。
      current = undefined
      if (userEvent.data.source?.kind !== 'user') continue
      const summary = extractText(userEvent.data.content).slice(0, SUMMARY_LIMIT)
      current = {
        messageId: String(userEvent.data.id),
        time: userEvent.time,
        summary,
        reply: '',
        toolCount: 0,
      }
      entries.push(current)
    } else if (event.type === 'assistant/message') {
      if (current === undefined) continue
      const assistantEvent = event as AssistantMessageEventLike
      const text = extractText(assistantEvent.data.message?.content)
      if (text !== '') {
        current.reply = `${current.reply} ${text}`.trim().slice(0, REPLY_LIMIT)
      }
    } else if (event.type === 'tool/call') {
      if (current !== undefined) current.toolCount++
    }
  }
  return entries
}

/** 系统默认应用打开器（无 shell；与官方 native-path-opener 同机制）。 */
export type NativeOpener = (path: string) => Promise<void>

export function createNativeOpener(): NativeOpener {
  return (path: string): Promise<void> =>
    new Promise((resolveOpen, reject) => {
      const onExit = (error: Error | null): void => {
        if (error !== null) reject(error)
        else resolveOpen()
      }
      if (process.platform === 'darwin') {
        execFile('open', [path], onExit)
      } else if (process.platform === 'win32') {
        execFile('powershell.exe', ['-NoProfile', '-Command', `Invoke-Item -LiteralPath '${path.replace(/'/g, "''")}'`], onExit)
      } else {
        execFile('xdg-open', [path], onExit)
      }
    })
}

export function apply(ctx: Context, config: Config): void {
  const openNative = createNativeOpener()
  ctx.effect(
    () => {
      const disposers = [
        ctx.webServer.register({
          kind: 'exact',
          path: LIST_ROUTE,
          handler: async (req: IncomingMessage, res: ServerResponse) => {
            try {
              if (req.method !== 'GET') {
                sendJson(res, 405, { error: { code: 'method-not-allowed', message: 'only GET is supported' } })
                return
              }
              const url = new URL(req.url ?? '/', 'http://localhost')
              const raw = url.searchParams.get('path')
              if (raw === null || raw === '') {
                sendJson(res, 400, { error: { code: 'missing-path', message: 'query ?path=<absolute directory> is required' } })
                return
              }
              const decoded = decodeURIComponent(raw)
              if (!isAbsolute(decoded)) {
                sendJson(res, 400, { error: { code: 'not-absolute', message: 'path must be absolute' } })
                return
              }
              const target = resolve(decoded)
              const roots = allowedRoots(ctx)
              if (!isInside(target, roots)) {
                sendJson(res, 403, { error: { code: 'forbidden', message: 'path is outside the workspace roots' } })
                return
              }
              const payload = await listLevel(ctx, config, target)
              sendJson(res, 200, payload)
            } catch (error) {
              const code = (error as { code?: string }).code
              if (code === 'ENOENT' || code === 'ENOTDIR' || code === 'EACCES') {
                sendJson(res, 404, { error: { code: 'unreadable', message: 'directory is not readable or missing' } })
                return
              }
              ctx.logger.warn(error)
              sendJson(res, 500, { error: { code: 'internal', message: 'failed to list directory' } })
            }
          },
        }),
        ctx.webServer.register({
          kind: 'exact',
          path: OUTLINE_ROUTE,
          handler: async (req: IncomingMessage, res: ServerResponse) => {
            try {
              if (req.method !== 'GET') {
                sendJson(res, 405, { error: { code: 'method-not-allowed', message: 'only GET is supported' } })
                return
              }
              const url = new URL(req.url ?? '/', 'http://localhost')
              const sessionId = url.searchParams.get('session')
              if (sessionId === null || sessionId === '') {
                sendJson(res, 400, { error: { code: 'missing-session', message: 'query ?session=<session id> is required' } })
                return
              }
              const session = ctx.sessions.get(sessionId as never)
              if (session === undefined) {
                sendJson(res, 404, { error: { code: 'session-not-found', message: 'no live session with that id' } })
                return
              }
              const entries = buildOutline(session.events as readonly unknown[])
              sendJson(res, 200, entries, true)
            } catch (error) {
              ctx.logger.warn(error)
              sendJson(res, 500, { error: { code: 'internal', message: 'failed to build message outline' } })
            }
          },
        }),
        ctx.webServer.register({
          kind: 'exact',
          path: OPEN_ROUTE,
          handler: async (req: IncomingMessage, res: ServerResponse) => {
            try {
              if (req.method !== 'GET') {
                sendJson(res, 405, { error: { code: 'method-not-allowed', message: 'only GET is supported' } })
                return
              }
              const url = new URL(req.url ?? '/', 'http://localhost')
              const raw = url.searchParams.get('path')
              if (raw === null || raw === '') {
                sendJson(res, 400, { error: { code: 'missing-path', message: 'query ?path=<absolute path> is required' } })
                return
              }
              const decoded = decodeURIComponent(raw)
              if (!isAbsolute(decoded)) {
                sendJson(res, 400, { error: { code: 'not-absolute', message: 'path must be absolute' } })
                return
              }
              const target = resolve(decoded)
              const roots = allowedRoots(ctx)
              if (!isInside(target, roots)) {
                sendJson(res, 403, { error: { code: 'forbidden', message: 'path is outside the workspace roots' } })
                return
              }
              await openNative(target)
              sendJson(res, 200, { opened: true })
            } catch (error) {
              ctx.logger.warn(error)
              const message = error instanceof Error ? error.message : String(error)
              sendJson(res, 500, { error: { code: 'open-failed', message: `path open failed: ${message}` } })
            }
          },
        }),
      ]
      return () => {
        for (const dispose of disposers) dispose()
      }
    },
    'dsh-workspace-inspector: routes',
  )
}
