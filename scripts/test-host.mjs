/**
 * host 半面独立验证：用桩 ctx 捕获路由 handler，模拟 HTTP 请求断言行为。
 * 必须从工作区根目录运行（process.cwd() 参与 allowlist 判定）。
 *   node scripts/test-host.mjs   （cwd = /Users/gight/Desktop/zero）
 */
import { apply, Config, buildOutline } from '../lib/index.js'

const routes = []
const fakeSessions = {
  get: (id) => fakeSessions.byId[id],
  byId: {},
}
const ctx = {
  webServer: {
    register: (route) => {
      routes.push(route)
      return () => {}
    },
  },
  sessions: fakeSessions,
  get: () => undefined,
  logger: { warn: (...args) => console.warn('[warn]', ...args) },
  effect: (fn) => fn(),
}

apply(ctx, Config({}))
const byPath = new Map(routes.map((r) => [r.path, r]))
if (byPath.size !== 3) throw new Error(`unexpected routes: ${routes.map((r) => r.path)}`)

function fakeRes() {
  let status = 0
  let headers = {}
  let body = ''
  return {
    writeHead: (s, h) => { status = s; headers = h },
    end: (b) => { body = String(b) },
    get result() { return { status, headers, body } },
  }
}

async function call(path, url, method = 'GET') {
  const res = fakeRes()
  await byPath.get(path).handler({ method, url }, res)
  return { ...res.result, json: res.result.body ? JSON.parse(res.result.body) : null }
}

const ROOT = '/Users/gight/Desktop/zero'
let failures = 0
function check(name, cond, detail) {
  if (cond) console.log(`  ✓ ${name}`)
  else { failures++; console.log(`  ✗ ${name} — ${detail}`) }
}

console.log('0) buildOutline（纯函数，完整历史重建）')
const events = [
  { type: 'turn/start', seq: 1, time: 1700000000000, data: { turn: 1 } },
  { type: 'user/message', seq: 2, time: 1700000000100, data: { id: 'msg-1', content: [{ type: 'text', text: '帮我看看 package.json' }], source: { kind: 'user' } } },
  { type: 'request/header', seq: 3, time: 1700000000200, data: { header: {} } },
  { type: 'assistant/message', seq: 4, time: 1700000000300, data: { message: { content: [{ type: 'text', text: '好的，这是依赖：' }, { type: 'text', text: 'esbuild、typescript。' }] } } },
  { type: 'tool/call', seq: 5, time: 1700000000400, data: { callId: 'c1', name: 'read', arguments: '{}' } },
  { type: 'tool/result', seq: 6, time: 1700000000500, data: { callId: 'c1' } },
  { type: 'user/message', seq: 7, time: 1700000000600, data: { id: 'msg-2', content: [{ type: 'text', text: '  再检查一遍\n     src 目录  ' }], source: { kind: 'user' } } },
  { type: 'assistant/message', seq: 8, time: 1700000000700, data: { message: { content: [{ type: 'text', text: '已检查。' }] } } },
  // 非 user 来源（agent.inject 上下文）不构成目录项
  { type: 'user/message', seq: 9, time: 1700000000800, data: { id: 'ctx-1', content: [{ type: 'text', text: '文件变化通知' }], source: { kind: 'context' } } },
  // 无 user 前缀的 assistant 消息被跳过
  { type: 'assistant/message', seq: 10, time: 1700000000900, data: { message: { content: [{ type: 'text', text: '孤儿回复' }] } } },
]
const outline = buildOutline(events)
check('两条用户消息目录项', outline.length === 2, JSON.stringify(outline))
check('msg-1 摘要正确', outline[0].summary === '帮我看看 package.json', outline[0].summary)
check('msg-1 回复合并两块文本', outline[0].reply === '好的，这是依赖： esbuild、typescript。', outline[0].reply)
check('msg-1 工具计数', outline[0].toolCount === 1, String(outline[0].toolCount))
check('msg-1 时间保留', outline[0].time === 1700000000100, String(outline[0].time))
check('msg-2 摘要去空白', outline[1].summary === '再检查一遍 src 目录', outline[1].summary)
check('msg-2 回复', outline[1].reply === '已检查。', outline[1].reply)
check('msg-2 工具计数归零', outline[1].toolCount === 0, String(outline[1].toolCount))
check('context 来源不入目录', !outline.some((e) => e.messageId === 'ctx-1'))
check('空日志', buildOutline([]).length === 0)

console.log('1) 列出工作区根：')
const list = await call('/__dsh-workspace-inspector/list', `/__dsh-workspace-inspector/list?path=${encodeURIComponent(ROOT)}`)
check('status 200', list.status === 200, `got ${list.status}`)
check('cache no-store', list.headers['Cache-Control'] === 'no-store', JSON.stringify(list.headers))
check('含插件目录条目', Array.isArray(list.json?.entries) && list.json.entries.some((e) => e.name === 'dsh-workspace-inspector' && e.kind === 'dir'), 'no dir entry')
check('含文件条目且带 size', list.json?.entries.some((e) => e.kind === 'file' && typeof e.size === 'number'), 'no file with size')
check('hidden 标记存在', list.json?.entries.every((e) => typeof e.hidden === 'boolean'), 'hidden flag missing')

console.log('2) 列出一层子目录（含文件）：')
const sub = await call('/__dsh-workspace-inspector/list', `/__dsh-workspace-inspector/list?path=${encodeURIComponent(ROOT + '/dsh-workspace-inspector')}`)
check('status 200', sub.status === 200, `got ${sub.status}`)
check('含 src 目录', sub.json?.entries.some((e) => e.name === 'src'), 'no src')
check('含 package.json 文件', sub.json?.entries.some((e) => e.name === 'package.json' && e.kind === 'file'), 'no package.json')

console.log('3) 安全边界：')
const forbidden = await call('/__dsh-workspace-inspector/list', `/__dsh-workspace-inspector/list?path=${encodeURIComponent('/etc')}`)
check('/etc → 403', forbidden.status === 403, `got ${forbidden.status}`)
const relative = await call('/__dsh-workspace-inspector/list', `/__dsh-workspace-inspector/list?path=${encodeURIComponent('relative/path')}`)
check('相对路径 → 400', relative.status === 400, `got ${relative.status}`)
const missing = await call('/__dsh-workspace-inspector/list', '/__dsh-workspace-inspector/list')
check('缺 path → 400', missing.status === 400, `got ${missing.status}`)
const post = await call('/__dsh-workspace-inspector/list', `/__dsh-workspace-inspector/list?path=${encodeURIComponent(ROOT)}`, 'POST')
check('POST → 405', post.status === 405, `got ${post.status}`)
const unreadable = await call('/__dsh-workspace-inspector/list', `/__dsh-workspace-inspector/list?path=${encodeURIComponent(ROOT + '/no-such-dir')}`)
check('不存在目录 → 404', unreadable.status === 404, `got ${unreadable.status}`)

console.log('4) 消息目录路由：')
const sid = 'session-00000000-0000-4000-8000-000000000000'
fakeSessions.byId[sid] = { events }
const resOutline = await call('/__dsh-workspace-inspector/outline', `/__dsh-workspace-inspector/outline?session=${sid}`)
check('status 200', resOutline.status === 200, `got ${resOutline.status}`)
check('entries 包裹结构', Array.isArray(resOutline.json?.entries), JSON.stringify(resOutline.json))
check('entries 内容正确', resOutline.json.entries.length === 2 && resOutline.json.entries[0].messageId === 'msg-1', JSON.stringify(resOutline.json?.entries))
const noSession = await call('/__dsh-workspace-inspector/outline', '/__dsh-workspace-inspector/outline?session=session-nope')
check('未知会话 → 404', noSession.status === 404, `got ${noSession.status}`)
const noParam = await call('/__dsh-workspace-inspector/outline', '/__dsh-workspace-inspector/outline')
check('缺 session → 400', noParam.status === 400, `got ${noParam.status}`)

console.log('5) 打开路由：')
const openMissing = await call('/__dsh-workspace-inspector/open', '/__dsh-workspace-inspector/open')
check('缺 path → 400', openMissing.status === 400, `got ${openMissing.status}`)
const openRelative = await call('/__dsh-workspace-inspector/open', `/__dsh-workspace-inspector/open?path=${encodeURIComponent('rel/file.txt')}`)
check('相对路径 → 400', openRelative.status === 400, `got ${openRelative.status}`)
const openForbidden = await call('/__dsh-workspace-inspector/open', `/__dsh-workspace-inspector/open?path=${encodeURIComponent('/etc/hosts')}`)
check('/etc/hosts → 403', openForbidden.status === 403, `got ${openForbidden.status}`)
const openPost = await call('/__dsh-workspace-inspector/open', `/__dsh-workspace-inspector/open?path=${encodeURIComponent(ROOT)}`, 'POST')
check('POST → 405', openPost.status === 405, `got ${openPost.status}`)
// 成功路径（真实 open）在 scratch 端到端验证，不在单测中触发。

console.log(failures === 0 ? '\n全部通过 ✅' : `\n${failures} 项失败 ❌`)
process.exit(failures === 0 ? 0 : 1)
