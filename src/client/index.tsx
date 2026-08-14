/**
 * dsh-workspace-inspector — browser 半面。
 *
 * 认领右侧 details 列（single / session scope，priority -1 遮蔽默认的
 * DetailsPanel）。面板内容：
 *   1. Token 用量：session 投影 tokenUsage，展示输入/缓存读取/输出及各自占比
 *      （不含 cacheWrite）；总计 = 输入+缓存读取+输出。
 *   2. 消息目录（全部历史）：host /outline 路由重放会话日志重建完整目录，
 *      每条用户消息可折叠展开看该轮回复摘要，点击条目滚动对话到对应消息行。
 *   3. 上下文压力：contextPressure 投影 + 窗口容量进度条。
 *   4. 工作区文件树：host /list 路由懒加载，目录可展开/折叠、隐藏文件开关、刷新。
 *   5. 关闭/重开：✕ 一次关闭右侧列；会话头部「概览」按钮重新打开。
 *
 * 面板挂载（有当前会话）时自动尝试打开右侧列（窄窗口下由浮层接管）。
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { ClientContext, SessionId } from '@deepseek-ai/dsh-client-runtime/client'
// Type-only：拉入 ui-layout 的 'details' SlotMap 声明与 ctx.layout 合并。
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
// Type-only：拉入 ui-conversation 的 SlotMap 合并（会话头部 utilities 席位）。
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
// Type-only：拉入 token-meter 的投影类型及其 SessionProjectionMap 合并。
import type { TokenUsageProjection } from '@deepseek-ai/dsh-token-meter/client'
import type {} from '@deepseek-ai/dsh-token-meter/client'
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { OutlineEntry } from './matching'
import { outlineKey } from './matching'

export const inject = ['slots', 'layout']

/** host 路由返回的目录条目。 */
interface TreeEntry {
  name: string
  path: string
  kind: 'dir' | 'file'
  size?: number
  hidden: boolean
}

interface DirPayload {
  path: string
  name: string
  entries: TreeEntry[]
  truncated: boolean
}

type DirState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; payload: DirPayload }

/** host /outline 返回的原始条目。 */
interface OutlineEntryData {
  messageId: string
  time: number
  summary: string
  reply: string
  toolCount: number
}

const MAX_DEPTH = 12
const LIST_URL = '/__dsh-workspace-inspector/list'
const OUTLINE_URL = '/__dsh-workspace-inspector/outline'
const OPEN_URL = '/__dsh-workspace-inspector/open'

/** 面板注入面：布局面板动作 + 系统默认打开文件。 */
export interface InspectorInjected {
  openDetails: () => void
  closeDetails: () => void
  openPath: (path: string) => Promise<void>
}

type InspectorProps = PropsRuntime<'details'> & InspectorInjected

/** 复用 details 列的原生外观变量。 */
const css = {
  root: {
    display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0,
    borderLeft: '1px solid var(--dsw-alias-border-l2)',
    background: 'var(--dsw-alias-bg-base)',
  } as const,
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
    padding: '14px 12px 12px', borderBottom: '1px solid var(--dsw-alias-border-l2)',
  } as const,
  title: {
    overflow: 'hidden', fontSize: 14, lineHeight: '20px', fontWeight: 500,
    color: 'var(--dsw-alias-label-primary)', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  } as const,
  close: {
    display: 'grid', flex: 'none', placeItems: 'center', width: 28, height: 28,
    border: 'none', borderRadius: 999, background: 'transparent',
    color: 'var(--dsw-alias-label-secondary)', cursor: 'pointer',
  } as const,
  body: { flex: 1, minHeight: 0, overflowY: 'auto', padding: '10px 12px 16px' } as const,
  section: { marginBottom: 14 } as const,
  sectionLabel: {
    fontSize: 11, lineHeight: '16px', fontWeight: 600, letterSpacing: '0.04em',
    color: 'var(--dsw-alias-label-tertiary)', textTransform: 'uppercase',
    marginBottom: 6,
  } as const,
  card: {
    border: '1px solid var(--dsw-alias-border-l1)',
    borderRadius: 10, background: 'var(--dsw-alias-fill-l1)',
    padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6,
  } as const,
  row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, fontSize: 12, lineHeight: '18px' } as const,
  rowLabel: { color: 'var(--dsw-alias-label-secondary)', minWidth: 0 } as const,
  rowValue: { color: 'var(--dsw-alias-label-primary)', fontVariantNumeric: 'tabular-nums', fontWeight: 500, whiteSpace: 'nowrap' } as const,
  rowSub: { color: 'var(--dsw-alias-label-tertiary)', fontSize: 11, fontVariantNumeric: 'tabular-nums', marginLeft: 4 } as const,
  barTrack: { height: 6, borderRadius: 999, background: 'var(--dsw-alias-fill-l2)', overflow: 'hidden' } as const,
  barFill: { height: '100%', borderRadius: 999, background: 'var(--dsw-alias-state-business-primary)', transition: 'width .2s ease' } as const,
  toolbar: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 } as const,
  button: {
    display: 'inline-flex', alignItems: 'center', gap: 4, border: '1px solid var(--dsw-alias-border-l1)',
    borderRadius: 6, background: 'transparent', color: 'var(--dsw-alias-label-secondary)',
    fontSize: 11, lineHeight: '16px', padding: '2px 8px', cursor: 'pointer',
  } as const,
  tree: { display: 'flex', flexDirection: 'column', gap: 1, fontSize: 12, lineHeight: '20px' } as const,
  treeRow: {
    display: 'flex', alignItems: 'center', gap: 4, padding: '1px 4px', borderRadius: 5,
    color: 'var(--dsw-alias-label-primary)', minWidth: 0, whiteSpace: 'nowrap',
  } as const,
  caret: {
    flex: 'none', width: 14, height: 14, display: 'grid', placeItems: 'center',
    color: 'var(--dsw-alias-label-tertiary)', cursor: 'pointer', border: 'none', background: 'transparent', padding: 0,
  } as const,
  dirIcon: { flex: 'none', width: 14, textAlign: 'center', color: 'var(--dsw-alias-label-tertiary)' } as const,
  fileIcon: { flex: 'none', width: 14, textAlign: 'center', color: 'var(--dsw-alias-label-caption)' } as const,
  name: { minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' } as const,
  fileRowClickable: { cursor: 'pointer' } as const,
  size: { flex: 'none', color: 'var(--dsw-alias-label-tertiary)', fontSize: 11, fontVariantNumeric: 'tabular-nums', marginLeft: 'auto', paddingLeft: 8 } as const,
  empty: { padding: '8px 0', fontSize: 12, color: 'var(--dsw-alias-label-tertiary)' } as const,
  hint: { fontSize: 11, color: 'var(--dsw-alias-label-tertiary)', marginTop: 4 } as const,
  // 消息目录
  outline: { display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 280, overflowY: 'auto', fontSize: 12 } as const,
  outlineRow: {
    display: 'flex', alignItems: 'center', gap: 4, padding: '3px 4px', borderRadius: 5,
    color: 'var(--dsw-alias-label-primary)', minWidth: 0,
  } as const,
  outlineSummary: {
    minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    cursor: 'pointer', flex: 1,
  } as const,
  outlineTime: { flex: 'none', color: 'var(--dsw-alias-label-tertiary)', fontSize: 11, fontVariantNumeric: 'tabular-nums' } as const,
  outlineMeta: { color: 'var(--dsw-alias-label-tertiary)', fontSize: 11, paddingLeft: 22 } as const,

} as const

function formatNumber(n: number | undefined): string {
  return n === undefined ? '—' : n.toLocaleString()
}

function formatBytes(n: number | undefined): string {
  if (n === undefined) return ''
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`
}

function percentOf(part: number | undefined, total: number | undefined): string {
  if (part === undefined || total === undefined || total <= 0) return ''
  return `(${((part / total) * 100).toFixed(1)}%)`
}

function formatTime(epochMs: number): string {
  const date = new Date(epochMs)
  const pad = (n: number): string => String(n).padStart(2, '0')
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

async function fetchJson<T>(url: string, signal: AbortSignal): Promise<T> {
  const res = await fetch(url, { cache: 'no-store', signal })
  const text = await res.text()
  let body: T | { error?: { code?: string; message?: string } }
  try {
    body = JSON.parse(text) as T | { error?: { code?: string; message?: string } }
  } catch {
    // 非 JSON 响应：通常是请求落到了 SPA fallback，说明服务器运行的是旧版插件
    // host 代码（该路由尚未注册），需要重启 dsh web。
    throw new Error('插件路由未响应（服务器可能是旧版本，请重启 dsh web 后再试）')
  }
  if (!res.ok) {
    const message = (body as { error?: { code?: string; message?: string } }).error?.message ?? `HTTP ${res.status}`
    throw new Error(message)
  }
  return body as T
}

/** 滚动对话视图到指定节点行并短暂高亮。 */
function scrollToChatKey(key: string): boolean {
  const row = document.querySelector<HTMLElement>(`[data-chat-anchor-key="${CSS.escape(key)}"]`)
  if (row === null) return false
  row.scrollIntoView({ behavior: 'smooth', block: 'center' })
  const previous = row.style.outline
  row.style.outline = '2px solid var(--dsw-alias-state-business-primary)'
  window.setTimeout(() => { row.style.outline = previous }, 1600)
  return true
}

// ── Token 用量卡片（含占比，不含 cacheWrite） ───────────────────────────────

function TokenCard({ usage }: { usage: TokenUsageProjection | undefined }) {
  if (usage === undefined) return <div style={css.empty}>暂无数据，等待首次模型请求…</div>
  const total = usage.uncachedInputTokens + usage.cacheReadTokens + usage.outputTokens
  const rows = [
    { label: '输入（未缓存）', value: usage.uncachedInputTokens },
    { label: '缓存读取', value: usage.cacheReadTokens },
    { label: '输出', value: usage.outputTokens },
  ]
  return (
    <div style={css.card}>
      {rows.map((row) => (
        <div key={row.label} style={css.row}>
          <span style={css.rowLabel}>{row.label}</span>
          <span style={css.rowValue}>
            {formatNumber(row.value)}
            <span style={css.rowSub}>{percentOf(row.value, total)}</span>
          </span>
        </div>
      ))}
      <div style={{ ...css.row, borderTop: '1px solid var(--dsw-alias-border-l1)', paddingTop: 6 }}>
        <span style={css.rowLabel}>总计（不含缓存写入）</span>
        <span style={css.rowValue}>{formatNumber(total)}</span>
      </div>
    </div>
  )
}

// ── 消息目录（全部历史，host 重建；按数量折叠 + 固定高度滚动，点击跳转） ─────

/** 消息目录折叠时最多直接展示的条目数；超出后需展开并在滚动区内查阅全部。 */
const OUTLINE_COLLAPSED_LIMIT = 5

function MessageOutline(props: { entries: OutlineEntry[]; onJump: (key: string) => void; jumpHint: string | null }) {
  const { entries, onJump, jumpHint } = props
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [showAll, setShowAll] = useState(false)

  if (entries.length === 0) return <div style={css.empty}>暂无消息记录。</div>

  const collapsible = entries.length > OUTLINE_COLLAPSED_LIMIT
  // 折叠态只展示最近几条（目录按时间升序，末尾为最新）；展开后展示全部，
  // 由 css.outline 的 maxHeight + overflowY 固定高度滚动查阅。
  const visible = !collapsible || showAll ? entries : entries.slice(-OUTLINE_COLLAPSED_LIMIT)
  const hiddenCount = entries.length - visible.length

  return (
    <div>
      {jumpHint !== null && <div style={{ ...css.hint, marginBottom: 4 }}>{jumpHint}</div>}
      {collapsible && (
        <div style={{ ...css.row, marginBottom: 4 }}>
          <span style={{ ...css.hint, marginTop: 0 }}>
            共 {entries.length} 条消息{hiddenCount > 0 ? `，折叠中 ${hiddenCount} 条` : ''}
          </span>
          <button type="button" style={css.button} onClick={() => setShowAll((v) => !v)}>
            {showAll ? '收起' : '显示全部'}
          </button>
        </div>
      )}
      <div style={css.outline}>
        {visible.map((entry) => {
          const open = expanded[entry.key] === true
          return (
            <div key={entry.key}>
              <div style={css.outlineRow}>
                <button
                  type="button"
                  style={css.caret}
                  aria-label={open ? '收起' : '展开'}
                  onClick={() => setExpanded((prev) => ({ ...prev, [entry.key]: !prev[entry.key] }))}
                >
                  <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden style={{ transform: open ? 'rotate(90deg)' : undefined, transition: 'transform .1s' }}>
                    <path d="M6 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <span style={css.outlineSummary} title="点击跳转到该消息" onClick={() => onJump(entry.key)}>
                  {entry.summary === '' ? `（消息 ${formatTime(entry.time)}）` : entry.summary}
                </span>
                <span style={css.outlineTime}>{formatTime(entry.time)}</span>
              </div>
              {open && (
                <div style={{ ...css.outlineMeta, marginBottom: 3 }}>
                  {entry.reply !== '' ? `回复：${entry.reply}` : '（该轮暂无文本回复）'}
                  {entry.toolCount > 0 && ` · 🛠 ${entry.toolCount} 次工具调用`}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── 工作区文件树 ────────────────────────────────────────────────────────────

function FileTree(props: {
  root: string
  workspaceTitle: string
  onOpenFile: (entry: TreeEntry) => void
  openError: string | null
}) {
  const { root, workspaceTitle, onOpenFile, openError } = props
  const [dirs, setDirs] = useState<Record<string, DirState>>({})
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ [root]: true })
  const [showHidden, setShowHidden] = useState(false)
  const [rootError, setRootError] = useState<string | null>(null)
  const inflight = useRef(new Map<string, AbortController>())

  const loadDir = (dir: string): void => {
    if (inflight.current.has(dir)) return
    const controller = new AbortController()
    inflight.current.set(dir, controller)
    setDirs((prev) => ({ ...prev, [dir]: { status: 'loading' } }))
    fetchJson<DirPayload>(`${LIST_URL}?path=${encodeURIComponent(dir)}`, controller.signal)
      .then((payload) => {
        setDirs((prev) => ({ ...prev, [dir]: { status: 'ready', payload } }))
        if (dir === root) setRootError(null)
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        const message = error instanceof Error ? error.message : String(error)
        setDirs((prev) => ({ ...prev, [dir]: { status: 'error', message } }))
        if (dir === root) setRootError(message)
      })
      .finally(() => {
        inflight.current.delete(dir)
      })
  }

  // 根目录变化时重置并加载。
  useEffect(() => {
    setDirs({})
    setExpanded({ [root]: true })
    setRootError(null)
    loadDir(root)
    return () => {
      for (const controller of inflight.current.values()) controller.abort()
      inflight.current.clear()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [root])

  // 卸载时中止全部在途请求。
  useEffect(() => {
    return () => {
      for (const controller of inflight.current.values()) controller.abort()
      inflight.current.clear()
    }
  }, [])

  const refresh = (): void => {
    for (const controller of inflight.current.values()) controller.abort()
    inflight.current.clear()
    setDirs({})
    setExpanded({ [root]: true })
    loadDir(root)
  }

  const toggle = (dir: string): void => {
    setExpanded((prev) => ({ ...prev, [dir]: !prev[dir] }))
    const state = dirs[dir]
    if ((state === undefined || state.status === 'error') && !expanded[dir]) loadDir(dir)
  }

  const visible = (entries: TreeEntry[]): TreeEntry[] =>
    showHidden ? entries : entries.filter((entry) => !entry.hidden)

  const renderNode = (entry: TreeEntry, depth: number): ReactNode => {
    const indent = { paddingLeft: depth * 14 + 4 } as const
    if (entry.kind === 'dir') {
      const state = dirs[entry.path]
      const open = expanded[entry.path] === true
      const ready = state?.status === 'ready'
      const children = ready ? visible(state.payload.entries) : []
      const tooDeep = depth >= MAX_DEPTH
      return (
        <div key={entry.path}>
          <div style={{ ...css.treeRow, ...indent }} title={`${entry.path}\n点击名称用系统默认应用打开`}>
            <button
              type="button"
              style={css.caret}
              aria-label={open ? '折叠' : '展开'}
              onClick={() => {
                if (tooDeep) return
                toggle(entry.path)
              }}
            >
              <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden style={{ transform: open ? 'rotate(90deg)' : undefined, transition: 'transform .1s' }}>
                <path d="M6 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <span style={css.dirIcon}>{open && !tooDeep ? '📂' : '📁'}</span>
            <span style={css.name}>{entry.name}</span>
            {state?.status === 'loading' && <span style={css.size}>…</span>}
            {state?.status === 'error' && <span style={css.size} title={state.message}>⚠</span>}
            {ready && children.length > 0 && <span style={css.size}>{children.length}</span>}
          </div>
          {open && !tooDeep && state?.status === 'ready' && (
            <div>
              {children.map((child) => renderNode(child, depth + 1))}
              {state.payload.truncated && <div style={{ ...css.treeRow, ...{ paddingLeft: depth * 14 + 22 }, color: 'var(--dsw-alias-label-tertiary)' }}>…（列表已截断）</div>}
            </div>
          )}
        </div>
      )
    }
    return (
      <div
        key={entry.path}
        style={{ ...css.treeRow, ...indent, ...css.fileRowClickable }}
        title={`${entry.path}\n点击用系统默认应用打开`}
        onClick={() => onOpenFile(entry)}
      >
        <span style={{ ...css.caret, visibility: 'hidden' }} />
        <span style={css.fileIcon}>📄</span>
        <span style={css.name}>{entry.name}</span>
        <span style={css.size}>{formatBytes(entry.size)}</span>
      </div>
    )
  }

  const rootState = dirs[root]
  return (
    <div>
      <div style={css.toolbar}>
        <button type="button" style={css.button} onClick={refresh}>⟳ 刷新</button>
        <button type="button" style={css.button} onClick={() => setShowHidden((v) => !v)}>
          {showHidden ? '✓ ' : ''}隐藏文件
        </button>
      </div>
      {openError !== null && <div style={{ ...css.hint, marginBottom: 4 }}>打开失败：{openError}</div>}
      <div style={css.tree}>
        <div style={{ ...css.treeRow, color: 'var(--dsw-alias-label-secondary)', fontWeight: 600 }}>
          <span style={css.caret} />
          <span style={css.dirIcon}>📂</span>
          <span style={css.name}>{workspaceTitle}</span>
        </div>
        {rootState?.status === 'loading' && <div style={css.empty}>加载中…</div>}
        {rootError !== null && (
          <div style={css.empty}>
            无法加载文件树：{rootError}
            <div style={css.hint}>
              <button type="button" style={css.button} onClick={refresh}>重试</button>
            </div>
          </div>
        )}
        {rootState?.status === 'ready' && visible(rootState.payload.entries).map((entry) => renderNode(entry, 1))}
        {rootState?.status === 'ready' && rootState.payload.truncated && <div style={css.empty}>…（列表已截断）</div>}
      </div>
    </div>
  )
}

// ── 面板主体（常规列与浮层共用） ────────────────────────────────────────────

function PanelBody(props: {
  sessionId: SessionId
  useSession: InspectorProps['useSession']
  useSessions: InspectorProps['useSessions']
  useProjection: InspectorProps['useProjection']
  useWorkspaces: InspectorProps['useWorkspaces']
  openPath: (path: string) => Promise<void>
}) {
  const { sessionId, useSession, useSessions, useProjection, useWorkspaces, openPath } = props

  const snapshot = useSession((s) => s)
  const sessions = useSessions((s) => s)
  const workspaces = useWorkspaces((w) => w)
  const usage = useProjection('tokenUsage')
  const pressure = useProjection('contextPressure')

  const root = useMemo(() => {
    const cwd = sessions.byId[sessionId]?.cwd
    if (cwd) return cwd
    const owned = workspaces.items.find((workspace) => workspace.sessionIds.includes(sessionId))
    if (owned) return owned.path
    const recent = workspaces.items.find((workspace) => workspace.workspaceId === workspaces.recentWorkspaceId)
    return recent?.path
  }, [sessions, workspaces, sessionId])

  const workspaceTitle = useMemo(() => {
    const owned = workspaces.items.find((workspace) => workspace.sessionIds.includes(sessionId))
    if (owned) return owned.title
    const recent = workspaces.items.find((workspace) => workspace.workspaceId === workspaces.recentWorkspaceId)
    return recent?.title ?? root
  }, [workspaces, sessionId, root])

  // 消息目录：host 重建完整历史。tokenUsage 投影变化（新消息完成）时刷新。
  const [outline, setOutline] = useState<OutlineEntry[]>([])
  const [outlineError, setOutlineError] = useState<string | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    setOutlineError(null)
    fetchJson<{ entries: OutlineEntryData[] }>(`${OUTLINE_URL}?session=${encodeURIComponent(sessionId)}`, controller.signal)
      .then((payload) => {
        setOutline((payload.entries ?? []).map((entry) => ({
          key: outlineKey(entry.messageId),
          summary: entry.summary,
          time: entry.time,
          reply: entry.reply,
          toolCount: entry.toolCount,
        })))
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setOutlineError(error instanceof Error ? error.message : String(error))
      })
    return () => controller.abort()
  }, [sessionId, usage])

  const projected = pressure?.projectedTokens ?? pressure?.pressureTokens
  const capacity = pressure?.contextWindow
  const percent = projected !== undefined && capacity !== undefined && capacity > 0
    ? Math.min(100, Math.max(0, (projected / capacity) * 100))
    : undefined

  const [jumpHint, setJumpHint] = useState<string | null>(null)
  const jumpHintTimer = useRef<number | null>(null)
  const handleJump = (key: string): void => {
    if (scrollToChatKey(key)) {
      setJumpHint('已跳转到对应消息')
    } else {
      setJumpHint('该消息不在当前对话窗口（请先加载更早历史或切回对话视图）')
    }
    if (jumpHintTimer.current !== null) window.clearTimeout(jumpHintTimer.current)
    jumpHintTimer.current = window.setTimeout(() => setJumpHint(null), 4000)
  }

  const [openFileError, setOpenFileError] = useState<string | null>(null)
  const openErrorTimer = useRef<number | null>(null)
  const handleOpenFile = (entry: { name: string; path: string }): void => {
    setOpenFileError(null)
    void openPath(entry.path).catch((error: unknown) => {
      setOpenFileError(error instanceof Error ? error.message : String(error))
      if (openErrorTimer.current !== null) window.clearTimeout(openErrorTimer.current)
      openErrorTimer.current = window.setTimeout(() => setOpenFileError(null), 5000)
    })
  }

  return (
    <div style={css.body}>
      <section style={css.section}>
        <div style={css.sectionLabel}>Token 用量（本会话累计）</div>
        <TokenCard usage={usage} />
      </section>

      <section style={css.section}>
        <div style={css.sectionLabel}>消息目录（全部历史）</div>
        {outlineError !== null ? (
          <div style={css.empty}>消息目录不可用：{outlineError}</div>
        ) : (
          <MessageOutline entries={outline} onJump={handleJump} jumpHint={jumpHint} />
        )}
      </section>

      <section style={css.section}>
        <div style={css.sectionLabel}>上下文压力</div>
        {projected === undefined ? (
          <div style={css.empty}>暂无数据，等待首次模型请求…</div>
        ) : (
          <div style={css.card}>
            <div style={css.row}>
              <span style={css.rowLabel}>预计下一次请求</span>
              <span style={css.rowValue}>{formatNumber(projected)}</span>
            </div>
            {capacity !== undefined && (
              <>
                <div style={css.barTrack}>
                  <div style={{ ...css.barFill, width: `${percent ?? 0}%` }} />
                </div>
                <div style={css.row}>
                  <span style={css.rowLabel}>上下文窗口</span>
                  <span style={css.rowValue}>
                    {formatNumber(projected)} / {formatNumber(capacity)}（{percent?.toFixed(1)}%）
                  </span>
                </div>
              </>
            )}
          </div>
        )}
      </section>

      <section style={css.section}>
        <div style={css.sectionLabel}>工作区文件</div>
        {root === undefined ? (
          <div style={css.empty}>当前会话没有可用的工作区路径。</div>
        ) : (
          <FileTree
            key={root}
            root={root}
            workspaceTitle={workspaceTitle ?? root}
            onOpenFile={handleOpenFile}
            openError={openFileError}
          />
        )}
      </section>
    </div>
  )
}

export function WorkspaceInspectorPanel({ sessionId, useSession, useSessions, useProjection, useWorkspaces, openDetails, closeDetails, openPath }: InspectorProps) {
  // 有当前会话时自动打开右侧列；会话切换（面板重挂载）也会重新打开。
  useEffect(() => {
    openDetails()
  }, [openDetails])

  const bodyProps = { sessionId, useSession, useSessions, useProjection, useWorkspaces, openPath }

  return (
    <div style={{ height: '100%', minWidth: 0, width: '100%' }}>
      <div style={css.root}>
        <div style={css.header}>
          <div style={css.title}>工作区概览</div>
          <button type="button" style={css.close} aria-label="关闭" onClick={closeDetails}>
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden>
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <PanelBody {...bodyProps} />
      </div>
    </div>
  )
}

/** 会话头部右侧的“概览”按钮：关闭右侧列后重新打开。 */
function OverviewReopenButton({ openOverview }: { openOverview: () => void }) {
  return (
    <button
      type="button"
      onClick={openOverview}
      title="打开工作区概览"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4, flex: 'none',
        border: '1px solid var(--dsw-alias-border-l1)', borderRadius: 6,
        background: 'transparent', color: 'var(--dsw-alias-label-secondary)',
        fontSize: 12, lineHeight: '18px', padding: '2px 8px', cursor: 'pointer',
      }}
    >
      📊 概览
    </button>
  )
}

/** 客户端插件入口：认领 details 列（遮蔽默认 DetailsPanel），注入面板动作。 */
export function apply(ctx: ClientContext): void {
  ctx.slots.inject('details', () => {
    const dispose = ctx.slots.register(
      {
        name: 'details',
        priority: -1,
        inject: (): InspectorInjected => ({
          openDetails: () => { ctx.layout.openDetails() },
          closeDetails: () => { ctx.layout.closeDetails() },
          openPath: (path: string) =>
            fetchJson<{ opened: boolean }>(`${OPEN_URL}?path=${encodeURIComponent(path)}`, new AbortController().signal)
              .then(() => undefined),
        }),
      },
      WorkspaceInspectorPanel,
    )
    return () => {
      dispose()
    }
  })

  // 会话头部工具区：关闭后可通过“概览”按钮重新打开右侧列。
  ctx.slots.inject('conversation.session.header.utilities', () => {
    const dispose = ctx.slots.register(
      {
        name: 'conversation.session.header.utilities',
        id: 'workspace-inspector-open',
        order: 20,
        inject: (): { openOverview: () => void } => ({
          openOverview: () => { ctx.layout.openDetails() },
        }),
      },
      OverviewReopenButton,
    )
    return () => {
      dispose()
    }
  })
}
