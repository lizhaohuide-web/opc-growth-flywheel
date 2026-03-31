/**
 * NovaAI Claude 客户端 - 向后兼容封装
 * 内部使用 unified-client
 */
import { callAI } from './unified-client'

export async function callNovaAIClaude(prompt: string, systemPrompt?: string): Promise<string> {
  return callAI(prompt, { provider: 'claude', systemPrompt })
}
