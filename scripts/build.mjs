/**
 * dsh-workspace-inspector 构建脚本（esbuild）
 *
 * host 半面：src/index.ts → lib/index.js（ESM / node，依赖外部化，由 profile 的
 *   node_modules 在运行时解析）。
 *
 * client 半面：src/client/index.tsx → lib/client.js，复刻官方 tsdown 的
 *   clientBundle 产物协议：
 *     window.__ModuleLoader__.load({ id, factory: (require) => { ... } })
 *   - format cjs / platform browser；
 *   - 平台模块（react 等）与 runtime/client 豁免保持 external，由浏览器 loader
 *     的模块表在运行时应答 require；
 *   - 其余依赖全部内联进 bundle（本插件 client 运行时只依赖 react）。
 */
import { build } from 'esbuild'
import { writeFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))

/** 官方 packages/client/web/src/platform.ts 的平台模块表（+ 文档化豁免）。 */
const PLATFORM_MODULES = [
  'react', 'react/jsx-runtime', 'react-dom', 'react-dom/client', '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-ui-slots', '@deepseek-ai/dsh-client-web-react',
  '@deepseek-ai/dsh-client-ui-primitives', '@deepseek-ai/dsh-client-ui-attachment',
  '@deepseek-ai/dsh-client-schema-form',
]
const CLIENT_EXTERNALS = [...PLATFORM_MODULES, '@deepseek-ai/dsh-client-runtime/client']

const PACKAGE_NAME = 'dsh-workspace-inspector'

// ── host 半面 ────────────────────────────────────────────────────────────────
await build({
  entryPoints: [join(ROOT, 'src/index.ts')],
  outfile: join(ROOT, 'lib/index.js'),
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'es2022',
  external: ['@deepseek-ai/cordis', '@deepseek-ai/schemastery'],
  sourcemap: true,
  logLevel: 'info',
})

// ── client 半面 ──────────────────────────────────────────────────────────────
await build({
  entryPoints: [join(ROOT, 'src/client/index.tsx')],
  outfile: join(ROOT, 'lib/client.js'),
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  target: 'es2020',
  jsx: 'automatic',
  external: CLIENT_EXTERNALS,
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
  },
  sourcemap: true,
  banner: {
    js: [
      `window.__ModuleLoader__.load({`,
      `  id: ${JSON.stringify(PACKAGE_NAME)},`,
      `  factory: (require) => {`,
      `    var module = { exports: {} };`,
      `    var exports = module.exports;`,
    ].join('\n'),
  },
  footer: {
    js: `return module.exports; } });`,
  },
  logLevel: 'info',
})

// ── 最小类型声明（消费方 IDE / 类型面） ──────────────────────────────────────
const hostDts = `export declare const name: string;
export declare const inject: string[];
export interface Config {
    /** 单层目录最多返回的条目数；超出截断并置 truncated。 */
    maxEntriesPerDir: number;
}
export declare const Config: any;
export declare function apply(ctx: any, config: Config): void;
`
const clientDts = `export declare const inject: string[];
export declare function apply(ctx: any): void;
`
await mkdir(join(ROOT, 'lib/types'), { recursive: true })
await writeFile(join(ROOT, 'lib/types/index.d.ts'), hostDts)
await writeFile(join(ROOT, 'lib/types/client.d.ts'), clientDts)

console.log('build ok: lib/index.js, lib/client.js, lib/types/*.d.ts')
