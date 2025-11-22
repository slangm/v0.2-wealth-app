import { Injectable } from "@nestjs/common"

type AdvisorMessage = {
  id: string
  role: "assistant" | "user"
  content: string
  createdAt: string
}

@Injectable()
export class AdvisorService {
  private readonly history: AdvisorMessage[] = [
    {
      id: "seed",
      role: "assistant",
      content: "I'm your AI guide. Let's get you to 6 months of runway first.",
      createdAt: new Date().toISOString(),
    },
  ]

  listHistory() {
    return this.history
  }

  async answer(prompt: string, totalNetWorth: number, monthlyExpenses: number) {
    const secureGoal = monthlyExpenses * 6
    const securePct = Math.min((totalNetWorth / secureGoal) * 100, 200)
    let recommendation =
      securePct >= 100
        ? "You can safely redirect new deposits toward the Growth strategy while keeping the first 6 months untouched."
        : "Focus deposits into Protected Savings until you reach the safety target. Consider enabling an auto-save with 60% of each deposit."

    const message: AdvisorMessage = {
      id: `assistant_${Date.now()}`,
      role: "assistant",
      content: `${recommendation}\n\nYou asked: "${prompt}"`,
      createdAt: new Date().toISOString(),
    }
    this.history.push(message)
    return message
  }
}

