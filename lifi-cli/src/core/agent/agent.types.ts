import type { OpenAI } from 'openai'

export interface AgentConfig {
  model: string
  systemPrompt?: string
  maxIterations?: number
}

export type AgentTool = OpenAI.Chat.Completions.ChatCompletionTool
export type AgentMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam
