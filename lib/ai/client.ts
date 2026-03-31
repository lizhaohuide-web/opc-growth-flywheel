/**
 * AI API 客户端 - 向后兼容封装
 * 内部使用 unified-client
 */
import { callAI as unifiedCallAI } from './unified-client'

export async function callAI(prompt: string, systemPrompt?: string): Promise<string> {
  return unifiedCallAI(prompt, { provider: 'qwen', systemPrompt })
}
