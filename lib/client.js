window.__ModuleLoader__.load({
  id: "dsh-workspace-inspector",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.tsx
var index_exports = {};
__export(index_exports, {
  WorkspaceInspectorPanel: () => WorkspaceInspectorPanel,
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);
var import_react = require("react");

// src/client/matching.ts
function outlineKey(messageId) {
  return `13:input-message${messageId}`;
}

// src/client/index.tsx
var import_jsx_runtime = require("react/jsx-runtime");
var inject = ["slots", "layout"];
var MAX_DEPTH = 12;
var LIST_URL = "/__dsh-workspace-inspector/list";
var OUTLINE_URL = "/__dsh-workspace-inspector/outline";
var OPEN_URL = "/__dsh-workspace-inspector/open";
var css = {
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    minWidth: 0,
    borderLeft: "1px solid var(--dsw-alias-border-l2)",
    background: "var(--dsw-alias-bg-base)"
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    padding: "14px 12px 12px",
    borderBottom: "1px solid var(--dsw-alias-border-l2)"
  },
  title: {
    overflow: "hidden",
    fontSize: 14,
    lineHeight: "20px",
    fontWeight: 500,
    color: "var(--dsw-alias-label-primary)",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  },
  close: {
    display: "grid",
    flex: "none",
    placeItems: "center",
    width: 28,
    height: 28,
    border: "none",
    borderRadius: 999,
    background: "transparent",
    color: "var(--dsw-alias-label-secondary)",
    cursor: "pointer"
  },
  body: { flex: 1, minHeight: 0, overflowY: "auto", padding: "10px 12px 16px" },
  section: { marginBottom: 14 },
  sectionLabel: {
    fontSize: 11,
    lineHeight: "16px",
    fontWeight: 600,
    letterSpacing: "0.04em",
    color: "var(--dsw-alias-label-tertiary)",
    textTransform: "uppercase",
    marginBottom: 6
  },
  card: {
    border: "1px solid var(--dsw-alias-border-l1)",
    borderRadius: 10,
    background: "var(--dsw-alias-fill-l1)",
    padding: "8px 10px",
    display: "flex",
    flexDirection: "column",
    gap: 6
  },
  row: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, fontSize: 12, lineHeight: "18px" },
  rowLabel: { color: "var(--dsw-alias-label-secondary)", minWidth: 0 },
  rowValue: { color: "var(--dsw-alias-label-primary)", fontVariantNumeric: "tabular-nums", fontWeight: 500, whiteSpace: "nowrap" },
  rowSub: { color: "var(--dsw-alias-label-tertiary)", fontSize: 11, fontVariantNumeric: "tabular-nums", marginLeft: 4 },
  barTrack: { height: 6, borderRadius: 999, background: "var(--dsw-alias-fill-l2)", overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 999, background: "var(--dsw-alias-state-business-primary)", transition: "width .2s ease" },
  toolbar: { display: "flex", alignItems: "center", gap: 6, marginBottom: 6 },
  button: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    border: "1px solid var(--dsw-alias-border-l1)",
    borderRadius: 6,
    background: "transparent",
    color: "var(--dsw-alias-label-secondary)",
    fontSize: 11,
    lineHeight: "16px",
    padding: "2px 8px",
    cursor: "pointer"
  },
  tree: { display: "flex", flexDirection: "column", gap: 1, fontSize: 12, lineHeight: "20px" },
  treeRow: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    padding: "1px 4px",
    borderRadius: 5,
    color: "var(--dsw-alias-label-primary)",
    minWidth: 0,
    whiteSpace: "nowrap"
  },
  caret: {
    flex: "none",
    width: 14,
    height: 14,
    display: "grid",
    placeItems: "center",
    color: "var(--dsw-alias-label-tertiary)",
    cursor: "pointer",
    border: "none",
    background: "transparent",
    padding: 0
  },
  dirIcon: { flex: "none", width: 14, textAlign: "center", color: "var(--dsw-alias-label-tertiary)" },
  fileIcon: { flex: "none", width: 14, textAlign: "center", color: "var(--dsw-alias-label-caption)" },
  name: { minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" },
  fileRowClickable: { cursor: "pointer" },
  size: { flex: "none", color: "var(--dsw-alias-label-tertiary)", fontSize: 11, fontVariantNumeric: "tabular-nums", marginLeft: "auto", paddingLeft: 8 },
  empty: { padding: "8px 0", fontSize: 12, color: "var(--dsw-alias-label-tertiary)" },
  hint: { fontSize: 11, color: "var(--dsw-alias-label-tertiary)", marginTop: 4 },
  // 消息目录
  outline: { display: "flex", flexDirection: "column", gap: 1, maxHeight: 280, overflowY: "auto", fontSize: 12 },
  outlineRow: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    padding: "3px 4px",
    borderRadius: 5,
    color: "var(--dsw-alias-label-primary)",
    minWidth: 0
  },
  outlineSummary: {
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    cursor: "pointer",
    flex: 1
  },
  outlineTime: { flex: "none", color: "var(--dsw-alias-label-tertiary)", fontSize: 11, fontVariantNumeric: "tabular-nums" },
  outlineMeta: { color: "var(--dsw-alias-label-tertiary)", fontSize: 11, paddingLeft: 22 }
};
function formatNumber(n) {
  return n === void 0 ? "\u2014" : n.toLocaleString();
}
function formatBytes(n) {
  if (n === void 0) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}
function percentOf(part, total) {
  if (part === void 0 || total === void 0 || total <= 0) return "";
  return `(${(part / total * 100).toFixed(1)}%)`;
}
function formatTime(epochMs) {
  const date = new Date(epochMs);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
async function fetchJson(url, signal) {
  const res = await fetch(url, { cache: "no-store", signal });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    throw new Error("\u63D2\u4EF6\u8DEF\u7531\u672A\u54CD\u5E94\uFF08\u670D\u52A1\u5668\u53EF\u80FD\u662F\u65E7\u7248\u672C\uFF0C\u8BF7\u91CD\u542F dsh web \u540E\u518D\u8BD5\uFF09");
  }
  if (!res.ok) {
    const message = body.error?.message ?? `HTTP ${res.status}`;
    throw new Error(message);
  }
  return body;
}
function scrollToChatKey(key) {
  const row = document.querySelector(`[data-chat-anchor-key="${CSS.escape(key)}"]`);
  if (row === null) return false;
  row.scrollIntoView({ behavior: "smooth", block: "center" });
  const previous = row.style.outline;
  row.style.outline = "2px solid var(--dsw-alias-state-business-primary)";
  window.setTimeout(() => {
    row.style.outline = previous;
  }, 1600);
  return true;
}
function TokenCard({ usage }) {
  if (usage === void 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.empty, children: "\u6682\u65E0\u6570\u636E\uFF0C\u7B49\u5F85\u9996\u6B21\u6A21\u578B\u8BF7\u6C42\u2026" });
  const total = usage.uncachedInputTokens + usage.cacheReadTokens + usage.outputTokens;
  const rows = [
    { label: "\u8F93\u5165\uFF08\u672A\u7F13\u5B58\uFF09", value: usage.uncachedInputTokens },
    { label: "\u7F13\u5B58\u8BFB\u53D6", value: usage.cacheReadTokens },
    { label: "\u8F93\u51FA", value: usage.outputTokens }
  ];
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: css.card, children: [
    rows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: css.row, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: css.rowLabel, children: row.label }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: css.rowValue, children: [
        formatNumber(row.value),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: css.rowSub, children: percentOf(row.value, total) })
      ] })
    ] }, row.label)),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { ...css.row, borderTop: "1px solid var(--dsw-alias-border-l1)", paddingTop: 6 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: css.rowLabel, children: "\u603B\u8BA1\uFF08\u4E0D\u542B\u7F13\u5B58\u5199\u5165\uFF09" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: css.rowValue, children: formatNumber(total) })
    ] })
  ] });
}
var OUTLINE_COLLAPSED_LIMIT = 5;
function MessageOutline(props) {
  const { entries, onJump, jumpHint } = props;
  const [expanded, setExpanded] = (0, import_react.useState)({});
  const [showAll, setShowAll] = (0, import_react.useState)(false);
  if (entries.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.empty, children: "\u6682\u65E0\u6D88\u606F\u8BB0\u5F55\u3002" });
  const collapsible = entries.length > OUTLINE_COLLAPSED_LIMIT;
  const visible = !collapsible || showAll ? entries : entries.slice(-OUTLINE_COLLAPSED_LIMIT);
  const hiddenCount = entries.length - visible.length;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
    jumpHint !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { ...css.hint, marginBottom: 4 }, children: jumpHint }),
    collapsible && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { ...css.row, marginBottom: 4 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { ...css.hint, marginTop: 0 }, children: [
        "\u5171 ",
        entries.length,
        " \u6761\u6D88\u606F",
        hiddenCount > 0 ? `\uFF0C\u6298\u53E0\u4E2D ${hiddenCount} \u6761` : ""
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", style: css.button, onClick: () => setShowAll((v) => !v), children: showAll ? "\u6536\u8D77" : "\u663E\u793A\u5168\u90E8" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.outline, children: visible.map((entry) => {
      const open = expanded[entry.key] === true;
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: css.outlineRow, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "button",
            {
              type: "button",
              style: css.caret,
              "aria-label": open ? "\u6536\u8D77" : "\u5C55\u5F00",
              onClick: () => setExpanded((prev) => ({ ...prev, [entry.key]: !prev[entry.key] })),
              children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { viewBox: "0 0 16 16", width: "12", height: "12", "aria-hidden": true, style: { transform: open ? "rotate(90deg)" : void 0, transition: "transform .1s" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M6 4l4 4-4 4", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }) })
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: css.outlineSummary, title: "\u70B9\u51FB\u8DF3\u8F6C\u5230\u8BE5\u6D88\u606F", onClick: () => onJump(entry.key), children: entry.summary === "" ? `\uFF08\u6D88\u606F ${formatTime(entry.time)}\uFF09` : entry.summary }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: css.outlineTime, children: formatTime(entry.time) })
        ] }),
        open && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { ...css.outlineMeta, marginBottom: 3 }, children: [
          entry.reply !== "" ? `\u56DE\u590D\uFF1A${entry.reply}` : "\uFF08\u8BE5\u8F6E\u6682\u65E0\u6587\u672C\u56DE\u590D\uFF09",
          entry.toolCount > 0 && ` \xB7 \u{1F6E0} ${entry.toolCount} \u6B21\u5DE5\u5177\u8C03\u7528`
        ] })
      ] }, entry.key);
    }) })
  ] });
}
function FileTree(props) {
  const { root, workspaceTitle, onOpenFile, openError } = props;
  const [dirs, setDirs] = (0, import_react.useState)({});
  const [expanded, setExpanded] = (0, import_react.useState)({ [root]: true });
  const [showHidden, setShowHidden] = (0, import_react.useState)(false);
  const [rootError, setRootError] = (0, import_react.useState)(null);
  const inflight = (0, import_react.useRef)(/* @__PURE__ */ new Map());
  const loadDir = (dir) => {
    if (inflight.current.has(dir)) return;
    const controller = new AbortController();
    inflight.current.set(dir, controller);
    setDirs((prev) => ({ ...prev, [dir]: { status: "loading" } }));
    fetchJson(`${LIST_URL}?path=${encodeURIComponent(dir)}`, controller.signal).then((payload) => {
      setDirs((prev) => ({ ...prev, [dir]: { status: "ready", payload } }));
      if (dir === root) setRootError(null);
    }).catch((error) => {
      if (controller.signal.aborted) return;
      const message = error instanceof Error ? error.message : String(error);
      setDirs((prev) => ({ ...prev, [dir]: { status: "error", message } }));
      if (dir === root) setRootError(message);
    }).finally(() => {
      inflight.current.delete(dir);
    });
  };
  (0, import_react.useEffect)(() => {
    setDirs({});
    setExpanded({ [root]: true });
    setRootError(null);
    loadDir(root);
    return () => {
      for (const controller of inflight.current.values()) controller.abort();
      inflight.current.clear();
    };
  }, [root]);
  (0, import_react.useEffect)(() => {
    return () => {
      for (const controller of inflight.current.values()) controller.abort();
      inflight.current.clear();
    };
  }, []);
  const refresh = () => {
    for (const controller of inflight.current.values()) controller.abort();
    inflight.current.clear();
    setDirs({});
    setExpanded({ [root]: true });
    loadDir(root);
  };
  const toggle = (dir) => {
    setExpanded((prev) => ({ ...prev, [dir]: !prev[dir] }));
    const state = dirs[dir];
    if ((state === void 0 || state.status === "error") && !expanded[dir]) loadDir(dir);
  };
  const visible = (entries) => showHidden ? entries : entries.filter((entry) => !entry.hidden);
  const renderNode = (entry, depth) => {
    const indent = { paddingLeft: depth * 14 + 4 };
    if (entry.kind === "dir") {
      const state = dirs[entry.path];
      const open = expanded[entry.path] === true;
      const ready = state?.status === "ready";
      const children = ready ? visible(state.payload.entries) : [];
      const tooDeep = depth >= MAX_DEPTH;
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { ...css.treeRow, ...indent }, title: `${entry.path}
\u70B9\u51FB\u540D\u79F0\u7528\u7CFB\u7EDF\u9ED8\u8BA4\u5E94\u7528\u6253\u5F00`, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "button",
            {
              type: "button",
              style: css.caret,
              "aria-label": open ? "\u6298\u53E0" : "\u5C55\u5F00",
              onClick: () => {
                if (tooDeep) return;
                toggle(entry.path);
              },
              children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { viewBox: "0 0 16 16", width: "12", height: "12", "aria-hidden": true, style: { transform: open ? "rotate(90deg)" : void 0, transition: "transform .1s" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M6 4l4 4-4 4", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }) })
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: css.dirIcon, children: open && !tooDeep ? "\u{1F4C2}" : "\u{1F4C1}" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: css.name, children: entry.name }),
          state?.status === "loading" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: css.size, children: "\u2026" }),
          state?.status === "error" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: css.size, title: state.message, children: "\u26A0" }),
          ready && children.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: css.size, children: children.length })
        ] }),
        open && !tooDeep && state?.status === "ready" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
          children.map((child) => renderNode(child, depth + 1)),
          state.payload.truncated && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { ...css.treeRow, ...{ paddingLeft: depth * 14 + 22 }, color: "var(--dsw-alias-label-tertiary)" }, children: "\u2026\uFF08\u5217\u8868\u5DF2\u622A\u65AD\uFF09" })
        ] })
      ] }, entry.path);
    }
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "div",
      {
        style: { ...css.treeRow, ...indent, ...css.fileRowClickable },
        title: `${entry.path}
\u70B9\u51FB\u7528\u7CFB\u7EDF\u9ED8\u8BA4\u5E94\u7528\u6253\u5F00`,
        onClick: () => onOpenFile(entry),
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { ...css.caret, visibility: "hidden" } }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: css.fileIcon, children: "\u{1F4C4}" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: css.name, children: entry.name }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: css.size, children: formatBytes(entry.size) })
        ]
      },
      entry.path
    );
  };
  const rootState = dirs[root];
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: css.toolbar, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", style: css.button, onClick: refresh, children: "\u27F3 \u5237\u65B0" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { type: "button", style: css.button, onClick: () => setShowHidden((v) => !v), children: [
        showHidden ? "\u2713 " : "",
        "\u9690\u85CF\u6587\u4EF6"
      ] })
    ] }),
    openError !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { ...css.hint, marginBottom: 4 }, children: [
      "\u6253\u5F00\u5931\u8D25\uFF1A",
      openError
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: css.tree, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { ...css.treeRow, color: "var(--dsw-alias-label-secondary)", fontWeight: 600 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: css.caret }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: css.dirIcon, children: "\u{1F4C2}" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: css.name, children: workspaceTitle })
      ] }),
      rootState?.status === "loading" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.empty, children: "\u52A0\u8F7D\u4E2D\u2026" }),
      rootError !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: css.empty, children: [
        "\u65E0\u6CD5\u52A0\u8F7D\u6587\u4EF6\u6811\uFF1A",
        rootError,
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.hint, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", style: css.button, onClick: refresh, children: "\u91CD\u8BD5" }) })
      ] }),
      rootState?.status === "ready" && visible(rootState.payload.entries).map((entry) => renderNode(entry, 1)),
      rootState?.status === "ready" && rootState.payload.truncated && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.empty, children: "\u2026\uFF08\u5217\u8868\u5DF2\u622A\u65AD\uFF09" })
    ] })
  ] });
}
function PanelBody(props) {
  const { sessionId, useSession, useSessions, useProjection, useWorkspaces, openPath } = props;
  const snapshot = useSession((s) => s);
  const sessions = useSessions((s) => s);
  const workspaces = useWorkspaces((w) => w);
  const usage = useProjection("tokenUsage");
  const pressure = useProjection("contextPressure");
  const root = (0, import_react.useMemo)(() => {
    const cwd = sessions.byId[sessionId]?.cwd;
    if (cwd) return cwd;
    const owned = workspaces.items.find((workspace) => workspace.sessionIds.includes(sessionId));
    if (owned) return owned.path;
    const recent = workspaces.items.find((workspace) => workspace.workspaceId === workspaces.recentWorkspaceId);
    return recent?.path;
  }, [sessions, workspaces, sessionId]);
  const workspaceTitle = (0, import_react.useMemo)(() => {
    const owned = workspaces.items.find((workspace) => workspace.sessionIds.includes(sessionId));
    if (owned) return owned.title;
    const recent = workspaces.items.find((workspace) => workspace.workspaceId === workspaces.recentWorkspaceId);
    return recent?.title ?? root;
  }, [workspaces, sessionId, root]);
  const [outline, setOutline] = (0, import_react.useState)([]);
  const [outlineError, setOutlineError] = (0, import_react.useState)(null);
  (0, import_react.useEffect)(() => {
    const controller = new AbortController();
    setOutlineError(null);
    fetchJson(`${OUTLINE_URL}?session=${encodeURIComponent(sessionId)}`, controller.signal).then((payload) => {
      setOutline((payload.entries ?? []).map((entry) => ({
        key: outlineKey(entry.messageId),
        summary: entry.summary,
        time: entry.time,
        reply: entry.reply,
        toolCount: entry.toolCount
      })));
    }).catch((error) => {
      if (controller.signal.aborted) return;
      setOutlineError(error instanceof Error ? error.message : String(error));
    });
    return () => controller.abort();
  }, [sessionId, usage]);
  const projected = pressure?.projectedTokens ?? pressure?.pressureTokens;
  const capacity = pressure?.contextWindow;
  const percent = projected !== void 0 && capacity !== void 0 && capacity > 0 ? Math.min(100, Math.max(0, projected / capacity * 100)) : void 0;
  const [jumpHint, setJumpHint] = (0, import_react.useState)(null);
  const jumpHintTimer = (0, import_react.useRef)(null);
  const handleJump = (key) => {
    if (scrollToChatKey(key)) {
      setJumpHint("\u5DF2\u8DF3\u8F6C\u5230\u5BF9\u5E94\u6D88\u606F");
    } else {
      setJumpHint("\u8BE5\u6D88\u606F\u4E0D\u5728\u5F53\u524D\u5BF9\u8BDD\u7A97\u53E3\uFF08\u8BF7\u5148\u52A0\u8F7D\u66F4\u65E9\u5386\u53F2\u6216\u5207\u56DE\u5BF9\u8BDD\u89C6\u56FE\uFF09");
    }
    if (jumpHintTimer.current !== null) window.clearTimeout(jumpHintTimer.current);
    jumpHintTimer.current = window.setTimeout(() => setJumpHint(null), 4e3);
  };
  const [openFileError, setOpenFileError] = (0, import_react.useState)(null);
  const openErrorTimer = (0, import_react.useRef)(null);
  const handleOpenFile = (entry) => {
    setOpenFileError(null);
    void openPath(entry.path).catch((error) => {
      setOpenFileError(error instanceof Error ? error.message : String(error));
      if (openErrorTimer.current !== null) window.clearTimeout(openErrorTimer.current);
      openErrorTimer.current = window.setTimeout(() => setOpenFileError(null), 5e3);
    });
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: css.body, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { style: css.section, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.sectionLabel, children: "Token \u7528\u91CF\uFF08\u672C\u4F1A\u8BDD\u7D2F\u8BA1\uFF09" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TokenCard, { usage })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { style: css.section, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.sectionLabel, children: "\u6D88\u606F\u76EE\u5F55\uFF08\u5168\u90E8\u5386\u53F2\uFF09" }),
      outlineError !== null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: css.empty, children: [
        "\u6D88\u606F\u76EE\u5F55\u4E0D\u53EF\u7528\uFF1A",
        outlineError
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageOutline, { entries: outline, onJump: handleJump, jumpHint })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { style: css.section, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.sectionLabel, children: "\u4E0A\u4E0B\u6587\u538B\u529B" }),
      projected === void 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.empty, children: "\u6682\u65E0\u6570\u636E\uFF0C\u7B49\u5F85\u9996\u6B21\u6A21\u578B\u8BF7\u6C42\u2026" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: css.card, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: css.row, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: css.rowLabel, children: "\u9884\u8BA1\u4E0B\u4E00\u6B21\u8BF7\u6C42" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: css.rowValue, children: formatNumber(projected) })
        ] }),
        capacity !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.barTrack, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { ...css.barFill, width: `${percent ?? 0}%` } }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: css.row, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: css.rowLabel, children: "\u4E0A\u4E0B\u6587\u7A97\u53E3" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: css.rowValue, children: [
              formatNumber(projected),
              " / ",
              formatNumber(capacity),
              "\uFF08",
              percent?.toFixed(1),
              "%\uFF09"
            ] })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { style: css.section, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.sectionLabel, children: "\u5DE5\u4F5C\u533A\u6587\u4EF6" }),
      root === void 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.empty, children: "\u5F53\u524D\u4F1A\u8BDD\u6CA1\u6709\u53EF\u7528\u7684\u5DE5\u4F5C\u533A\u8DEF\u5F84\u3002" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        FileTree,
        {
          root,
          workspaceTitle: workspaceTitle ?? root,
          onOpenFile: handleOpenFile,
          openError: openFileError
        },
        root
      )
    ] })
  ] });
}
function WorkspaceInspectorPanel({ sessionId, useSession, useSessions, useProjection, useWorkspaces, openDetails, closeDetails, openPath }) {
  (0, import_react.useEffect)(() => {
    openDetails();
  }, [openDetails]);
  const bodyProps = { sessionId, useSession, useSessions, useProjection, useWorkspaces, openPath };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { height: "100%", minWidth: 0, width: "100%" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: css.root, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: css.header, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: css.title, children: "\u5DE5\u4F5C\u533A\u6982\u89C8" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", style: css.close, "aria-label": "\u5173\u95ED", onClick: closeDetails, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { viewBox: "0 0 16 16", width: "14", height: "14", "aria-hidden": true, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M4 4l8 8M12 4l-8 8", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" }) }) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PanelBody, { ...bodyProps })
  ] }) });
}
function OverviewReopenButton({ openOverview }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "button",
    {
      type: "button",
      onClick: openOverview,
      title: "\u6253\u5F00\u5DE5\u4F5C\u533A\u6982\u89C8",
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        flex: "none",
        border: "1px solid var(--dsw-alias-border-l1)",
        borderRadius: 6,
        background: "transparent",
        color: "var(--dsw-alias-label-secondary)",
        fontSize: 12,
        lineHeight: "18px",
        padding: "2px 8px",
        cursor: "pointer"
      },
      children: "\u{1F4CA} \u6982\u89C8"
    }
  );
}
function apply(ctx) {
  ctx.slots.inject("details", () => {
    const dispose = ctx.slots.register(
      {
        name: "details",
        priority: -1,
        inject: () => ({
          openDetails: () => {
            ctx.layout.openDetails();
          },
          closeDetails: () => {
            ctx.layout.closeDetails();
          },
          openPath: (path) => fetchJson(`${OPEN_URL}?path=${encodeURIComponent(path)}`, new AbortController().signal).then(() => void 0)
        })
      },
      WorkspaceInspectorPanel
    );
    return () => {
      dispose();
    };
  });
  ctx.slots.inject("conversation.session.header.utilities", () => {
    const dispose = ctx.slots.register(
      {
        name: "conversation.session.header.utilities",
        id: "workspace-inspector-open",
        order: 20,
        inject: () => ({
          openOverview: () => {
            ctx.layout.openDetails();
          }
        })
      },
      OverviewReopenButton
    );
    return () => {
      dispose();
    };
  });
}
return module.exports; } });
//# sourceMappingURL=client.js.map
