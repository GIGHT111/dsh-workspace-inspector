// src/index.ts
import { execFile } from "node:child_process";
import { readdir, stat } from "node:fs/promises";
import { basename, isAbsolute, join, resolve, sep } from "node:path";
import z from "@deepseek-ai/schemastery";
var name = "dsh-workspace-inspector";
var inject = ["webServer", "sessions"];
var Config = z.object({
  maxEntriesPerDir: z.natural().min(1).max(1e5).default(1e3)
});
var LIST_ROUTE = "/__dsh-workspace-inspector/list";
var OUTLINE_ROUTE = "/__dsh-workspace-inspector/outline";
var OPEN_ROUTE = "/__dsh-workspace-inspector/open";
function sendJson(res, status, payload, envelope = false) {
  const body = envelope ? JSON.stringify({ entries: payload }) : JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(body);
}
function allowedRoots(ctx) {
  const roots = [process.cwd()];
  const registry = ctx.get("workspaceRegistry");
  if (registry !== void 0) {
    for (const workspace of registry.list()) roots.push(resolve(workspace.path));
  }
  return roots;
}
function pathKey(p) {
  return process.platform === "win32" ? p.toLowerCase() : p;
}
function isInside(target, roots) {
  const t = pathKey(target);
  return roots.some((root) => {
    const r = pathKey(root);
    return t === r || t.startsWith(r + sep);
  });
}
async function listLevel(ctx, config, target) {
  const dirents = await readdir(target, { withFileTypes: true });
  const sorted = [...dirents].sort((a, b) => {
    const aDir = a.isDirectory() || a.isSymbolicLink() ? 0 : 1;
    const bDir = b.isDirectory() || b.isSymbolicLink() ? 0 : 1;
    if (aDir !== bDir) return aDir - bDir;
    return a.name.localeCompare(b.name);
  });
  const entries = [];
  let truncated = false;
  for (const dirent of sorted) {
    if (entries.length >= config.maxEntriesPerDir) {
      truncated = true;
      break;
    }
    const entryPath = join(target, dirent.name);
    const isDir = dirent.isDirectory() || (dirent.isSymbolicLink() ? (await stat(entryPath)).isDirectory() : false);
    const row = {
      name: dirent.name,
      path: entryPath,
      kind: isDir ? "dir" : "file",
      hidden: dirent.name.startsWith(".")
    };
    if (!isDir) {
      try {
        row.size = (await stat(entryPath)).size;
      } catch {
      }
    }
    entries.push(row);
  }
  return { path: target, name: basename(target), entries, truncated };
}
function extractText(content) {
  if (content === void 0) return "";
  const parts = [];
  for (const block of content) {
    if (block?.type === "text" && typeof block.text === "string") parts.push(block.text);
  }
  return parts.join(" ").replace(/\s+/g, " ").trim();
}
var SUMMARY_LIMIT = 48;
var REPLY_LIMIT = 96;
function buildOutline(events) {
  const entries = [];
  let current;
  for (const raw of events) {
    const event = raw;
    if (event.type === "user/message") {
      const userEvent = event;
      current = void 0;
      if (userEvent.data.source?.kind !== "user") continue;
      const summary = extractText(userEvent.data.content).slice(0, SUMMARY_LIMIT);
      current = {
        messageId: String(userEvent.data.id),
        time: userEvent.time,
        summary,
        reply: "",
        toolCount: 0
      };
      entries.push(current);
    } else if (event.type === "assistant/message") {
      if (current === void 0) continue;
      const assistantEvent = event;
      const text = extractText(assistantEvent.data.message?.content);
      if (text !== "") {
        current.reply = `${current.reply} ${text}`.trim().slice(0, REPLY_LIMIT);
      }
    } else if (event.type === "tool/call") {
      if (current !== void 0) current.toolCount++;
    }
  }
  return entries;
}
function createNativeOpener() {
  return (path) => new Promise((resolveOpen, reject) => {
    const onExit = (error) => {
      if (error !== null) reject(error);
      else resolveOpen();
    };
    if (process.platform === "darwin") {
      execFile("open", [path], onExit);
    } else if (process.platform === "win32") {
      execFile("powershell.exe", ["-NoProfile", "-Command", `Invoke-Item -LiteralPath '${path.replace(/'/g, "''")}'`], onExit);
    } else {
      execFile("xdg-open", [path], onExit);
    }
  });
}
function apply(ctx, config) {
  const openNative = createNativeOpener();
  ctx.effect(
    () => {
      const disposers = [
        ctx.webServer.register({
          kind: "exact",
          path: LIST_ROUTE,
          handler: async (req, res) => {
            try {
              if (req.method !== "GET") {
                sendJson(res, 405, { error: { code: "method-not-allowed", message: "only GET is supported" } });
                return;
              }
              const url = new URL(req.url ?? "/", "http://localhost");
              const raw = url.searchParams.get("path");
              if (raw === null || raw === "") {
                sendJson(res, 400, { error: { code: "missing-path", message: "query ?path=<absolute directory> is required" } });
                return;
              }
              const decoded = decodeURIComponent(raw);
              if (!isAbsolute(decoded)) {
                sendJson(res, 400, { error: { code: "not-absolute", message: "path must be absolute" } });
                return;
              }
              const target = resolve(decoded);
              const roots = allowedRoots(ctx);
              if (!isInside(target, roots)) {
                sendJson(res, 403, { error: { code: "forbidden", message: "path is outside the workspace roots" } });
                return;
              }
              const payload = await listLevel(ctx, config, target);
              sendJson(res, 200, payload);
            } catch (error) {
              const code = error.code;
              if (code === "ENOENT" || code === "ENOTDIR" || code === "EACCES") {
                sendJson(res, 404, { error: { code: "unreadable", message: "directory is not readable or missing" } });
                return;
              }
              ctx.logger.warn(error);
              sendJson(res, 500, { error: { code: "internal", message: "failed to list directory" } });
            }
          }
        }),
        ctx.webServer.register({
          kind: "exact",
          path: OUTLINE_ROUTE,
          handler: async (req, res) => {
            try {
              if (req.method !== "GET") {
                sendJson(res, 405, { error: { code: "method-not-allowed", message: "only GET is supported" } });
                return;
              }
              const url = new URL(req.url ?? "/", "http://localhost");
              const sessionId = url.searchParams.get("session");
              if (sessionId === null || sessionId === "") {
                sendJson(res, 400, { error: { code: "missing-session", message: "query ?session=<session id> is required" } });
                return;
              }
              const session = ctx.sessions.get(sessionId);
              if (session === void 0) {
                sendJson(res, 404, { error: { code: "session-not-found", message: "no live session with that id" } });
                return;
              }
              const entries = buildOutline(session.events);
              sendJson(res, 200, entries, true);
            } catch (error) {
              ctx.logger.warn(error);
              sendJson(res, 500, { error: { code: "internal", message: "failed to build message outline" } });
            }
          }
        }),
        ctx.webServer.register({
          kind: "exact",
          path: OPEN_ROUTE,
          handler: async (req, res) => {
            try {
              if (req.method !== "GET") {
                sendJson(res, 405, { error: { code: "method-not-allowed", message: "only GET is supported" } });
                return;
              }
              const url = new URL(req.url ?? "/", "http://localhost");
              const raw = url.searchParams.get("path");
              if (raw === null || raw === "") {
                sendJson(res, 400, { error: { code: "missing-path", message: "query ?path=<absolute path> is required" } });
                return;
              }
              const decoded = decodeURIComponent(raw);
              if (!isAbsolute(decoded)) {
                sendJson(res, 400, { error: { code: "not-absolute", message: "path must be absolute" } });
                return;
              }
              const target = resolve(decoded);
              const roots = allowedRoots(ctx);
              if (!isInside(target, roots)) {
                sendJson(res, 403, { error: { code: "forbidden", message: "path is outside the workspace roots" } });
                return;
              }
              await openNative(target);
              sendJson(res, 200, { opened: true });
            } catch (error) {
              ctx.logger.warn(error);
              const message = error instanceof Error ? error.message : String(error);
              sendJson(res, 500, { error: { code: "open-failed", message: `path open failed: ${message}` } });
            }
          }
        })
      ];
      return () => {
        for (const dispose of disposers) dispose();
      };
    },
    "dsh-workspace-inspector: routes"
  );
}
export {
  Config,
  apply,
  buildOutline,
  createNativeOpener,
  inject,
  name
};
//# sourceMappingURL=index.js.map
