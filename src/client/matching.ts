/**
 * 纯逻辑（无 React、无 DOM）：消息目录的 chat 节点 key 计算。
 * 完整目录数据由 host /outline 路由从会话持久化日志重建（客户端事件窗口
 * 只有最近若干消息，看不到全部历史）。
 */
/** 消息目录条目（host 数据 + 客户端 key 计算后的展示形态）。 */
export interface OutlineEntry {
  /** 该消息节点在对话中的 key（data-chat-anchor-key，用于滚动定位）。 */
  key: string
  /** 用户消息文本摘要（去空白、截断）。 */
  summary: string
  /** 消息时间（epoch ms）。 */
  time: number
  /** 该轮 assistant 文本回复摘要（截断）。 */
  reply: string
  /** 该轮工具调用次数。 */
  toolCount: number
}

/**
 * ui-conversation 的 input-message 节点 key：
 * conversationContextKey('input-message', messageId) = `${13}:input-message${id}`。
 * 该 key 同时是 ChatNodeSeat 行的 data-chat-anchor-key，用于滚动定位。
 */
export function outlineKey(messageId: string): string {
  return `13:input-message${messageId}`
}
