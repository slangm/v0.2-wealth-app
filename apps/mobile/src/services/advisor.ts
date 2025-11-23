import { apiPost } from "./api-client"
import { getLadderCopy } from "./portfolio"

export type AdvisorMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt: string
  actions?: Array<{ summary: string; type?: string; simulationOnly?: boolean; preparedId?: string }>
}

const seedMessages: AdvisorMessage[] = [
  {
    id: "seed-1",
    role: "assistant",
    content: "👋 Welcome! Let's make sure you reach six months of emergency savings. Want to set up a recurring auto-save?",
    createdAt: new Date().toISOString(),
  },
]

export async function fetchAdvisorHistory(token?: string) {
  try {
    // Placeholder: backend does not yet expose chat history; keep seed
    await apiGet("/agent/logs", token)
  } catch {
    // ignore
  }
  return seedMessages
}

export async function sendAdvisorPrompt(
  {
    prompt,
    totalNetWorth,
    monthlyExpenses,
  }: {
    prompt: string
    totalNetWorth: number
    monthlyExpenses: number
  },
  token?: string,
) {
  const contextCopy = getLadderCopy(totalNetWorth, monthlyExpenses)
  try {
    const response = await apiPost<{
      reply: string
      actions?: Array<{ summary: string; type?: string; simulationOnly?: boolean }>
      compliance?: { canTrade: boolean; region: string }
    }>(
      "/agent/chat",
      { message: prompt, totalNetWorth, monthlyExpenses },
      token,
    )
    return {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content: response.reply,
      actions: response.actions,
      createdAt: new Date().toISOString(),
    }
  } catch {
    return {
      id: `local-${Date.now()}`,
      role: "assistant" as const,
      content: `${contextCopy.headline}\n\n${contextCopy.body}\n\nYou asked: "${prompt}" – here's what I recommend: start with ${
        Math.round(monthlyExpenses * 6)
      } USD in Protected Savings, then auto-route +30% of new deposits into Growth.`,
      createdAt: new Date().toISOString(),
    }
  }
}
