import { GoogleGenerativeAI } from "@google/generative-ai"

export type GeminiFunctionCall = {
  name?: string
  args?: Record<string, unknown>
}

export const chatToolDefinitions = [
  {
    name: "save_task",
    description: "Save a task or to-do item into the current workspace.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Short task title" },
        description: { type: "string", description: "Optional longer description" },
        due_date: { type: "string", description: "Optional ISO date, e.g. 2026-07-06" },
      },
      required: ["title"],
    },
  },
  {
    name: "send_summary_to_discord",
    description: "Send a short summary message to the workspace's Discord channel.",
    parameters: {
      type: "object",
      properties: {
        summary: { type: "string", description: "The message text to send" },
      },
      required: ["summary"],
    },
  },
] as const

export function getFunctionCallFromResponse(response: Awaited<ReturnType<ReturnType<GoogleGenerativeAI["getGenerativeModel"]>["generateContent"]>>["response"]): GeminiFunctionCall | null {
  const fromHelper = response.functionCalls?.() ?? []
  if (fromHelper.length > 0) {
    return fromHelper[0] as GeminiFunctionCall
  }

  const parts = response.candidates?.[0]?.content?.parts ?? []
  for (const part of parts) {
    const functionCall = (part as { functionCall?: GeminiFunctionCall }).functionCall
    if (functionCall?.name) {
      return functionCall
    }
  }

  return null
}