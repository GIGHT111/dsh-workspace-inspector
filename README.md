# dsh-workspace-inspector

DeepSeek Harness (DSH) Web 客户端插件：在**右侧详情列**显示当前会话的 **Token 用量**、**消息目录（全部历史）** 与 **工作区文件树**。跨平台（macOS / Windows / Linux）。

## 功能

- **Token 用量（本会话累计）**：输入（未缓存）、缓存读取、输出及**各自占比**（不含缓存写入），总计 = 输入+缓存读取+输出 —— 来自 `tokenUsage` 会话投影。
- **消息目录（全部历史）**：host 重放会话**完整持久化日志**重建目录（客户端事件窗口只有最近约 50 条消息，看不到全部历史）。每条用户消息可折叠展开看该轮回复摘要与工具调用次数；点击条目滚动对话到对应消息行并高亮（若目标消息不在当前已加载窗口，会提示先加载更早历史）。摘要为启发式文本提炼，非 LLM 生成。
- **上下文压力**：下一次请求的预计 token 数、上下文窗口容量与占用百分比 —— 来自 `contextPressure` 投影。
- **工作区文件树**：以当前会话工作区为根，目录懒加载、可展开/折叠，文件显示大小；**点击文件行用系统默认应用打开**（插件自有 host 路由，与官方 openPath 同机制）；隐藏文件开关与刷新。
- **关闭/重开**：✕ 一次关闭右侧列（无悬浮模式）；会话头部右侧出现「📊 概览」按钮，点击重新打开右侧列，恢复原生拖拽分栏调整大小。

## 架构

双面（dual-face）插件：

| 半面 | 入口 | 职责 |
|---|---|---|
| host | `lib/index.js`（`src/index.ts`） | 注册三个 webserver 精确路由：`GET /__dsh-workspace-inspector/list?path=<abs>` 返回单层目录条目（目录+文件+size+hidden）；`GET /__dsh-workspace-inspector/outline?session=<id>` 重放会话日志重建完整消息目录；`GET /__dsh-workspace-inspector/open?path=<abs>` 用系统默认应用打开文件（macOS open / Windows Invoke-Item / Linux xdg-open）。list/open 仅允许 host cwd 或已注册 workspace 根之下的绝对路径（Windows 大小写不敏感）；均 `Cache-Control: no-store`。 |
| client | `lib/client.js`（`src/client/index.tsx` + `src/client/matching.ts`） | 认领右侧 `details` 列（single/session，priority -1 遮蔽默认 DetailsPanel），有会话时自动打开右侧列；✕ 一次关闭，会话头部「概览」按钮重新打开。消息目录 key 计算在 `matching.ts`（纯函数，可单测）。 |

client bundle 遵循官方 `__ModuleLoader__.load({ id, factory })` 协议：平台模块（react 等）external，由浏览器模块表应答；其余依赖内联。

## 构建与测试

```sh
npm install        # devDeps: esbuild / typescript / @types/*
npm run typecheck
npm run build      # 产出 lib/index.js + lib/client.js + lib/types
npm run test:host    # host 路由行为 + 完整消息目录重建（含边界）
npm run test:client  # client 消息目录 key 纯逻辑
```

## 安装

### 本地路径

```sh
# 需要 pnpm 在 PATH 中
dsh plugin --profile web add /path/to/dsh-workspace-inspector
```

### GitHub（推荐）

仓库已提交构建产物 `lib/`，从 Git 安装**无需执行任何构建脚本**：

```sh
dsh plugin --profile web add github:<owner>/<repo>
# 或带分支/提交：github:<owner>/<repo>#<branch>
```

安装后重启 web profile：

```sh
dsh --profile web
```

之后每次修改插件代码只需 `npm run build` 并刷新页面（bundle 内容变更走 client HMR；manifest/行结构变更需再次重启）。

## 打包发布

```sh
npm install       # 安装构建依赖（仅开发需要）
npm run typecheck && npm run build && npm run test:host && npm run test:client
npm pack          # 生成 dsh-workspace-inspector-<version>.tgz（npm pack 自动包含 lib/ + README + LICENSE + cordis.patch.yml）
```

`*.tgz` 也可直接安装：

```sh
dsh plugin --profile web add /path/to/dsh-workspace-inspector-0.1.0.tgz
```

## 配置

可在 profile 的 `cordis.patch.yml` 中覆盖该行配置：

```yaml
- id: workspace-inspector
  config:
    maxEntriesPerDir: 1000   # 单层目录最多返回条目数
```

## 说明与边界

- 右侧列默认由 `ui-conversation` 的 DetailsPanel 占用（当前无任何代码会打开它，处于休眠态）；本插件以更低 priority 遮蔽它并在会话存在时自动打开。卸载插件后恢复原状。
- `tokenUsage`/`contextPressure` 来自 host 端 token-meter 投影（本会话累计）。
- 消息目录由 host 从持久化日志重建，覆盖全部历史；跳转依赖对话视图已加载对应消息行，未加载时会提示。
- 文件树经 localhost HTTP 路由读取，仅限工作区根之内的路径；不在浏览器 RPC 信任围栏内，请勿在不可信网络环境中暴露 3080 端口。
