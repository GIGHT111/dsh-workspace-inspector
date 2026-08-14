/**
 * client 纯逻辑单测：matching.ts（消息目录 chat 节点 key 计算 outlineKey）。
 * 用 esbuild 把 matching.ts 编成临时 ESM 后导入。
 *   node scripts/test-client.mjs
 */
import { build } from 'esbuild'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = mkdtempSync(join(tmpdir(), 'dsh-client-test-'))
const out = join(dir, 'matching.mjs')
await build({
  entryPoints: [fileURLToPath(new URL('../src/client/matching.ts', import.meta.url))],
  outfile: out,
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  logLevel: 'silent',
})
const m = await import(out)

let failures = 0
function check(name, cond, detail) {
  if (cond) console.log(`  ✓ ${name}`)
  else { failures++; console.log(`  ✗ ${name} — ${detail}`) }
}

console.log('1) outlineKey（conversationContextKey("input-message", id) 等价）')
check('普通 id', m.outlineKey('msg-abc') === '13:input-messagemsg-abc', m.outlineKey('msg-abc'))
check('含数字 id', m.outlineKey('42') === '13:input-message42', m.outlineKey('42'))
check('含特殊字符 id（原样拼接，与引擎一致）', m.outlineKey('a:b{c}') === '13:input-messagea:b{c}', m.outlineKey('a:b{c}'))
check('空 id', m.outlineKey('') === '13:input-message', m.outlineKey(''))

// OutlineEntry 类型仅为类型导出，运行时无值可测；验证模块可加载即可。
check('模块导出结构', typeof m.outlineKey === 'function')

console.log(failures === 0 ? '\n全部通过 ✅' : `\n${failures} 项失败 ❌`)
process.exit(failures === 0 ? 0 : 1)
