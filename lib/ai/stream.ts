/**
 * 流式 AI 调用 - 向后兼容封装
 * 内部使用 unified-client
 */
import { callAIStream as unifiedCallAIStream } from './unified-client'

export function callAIStream(prompt: string, systemPrompt?: string): ReadableStream {
  return unifiedCallAIStream(prompt, { provider: 'qwen', systemPrompt })
}
