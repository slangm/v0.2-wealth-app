import { apiPost } from "./api-client"

export async function depositSafe(amount: number, token?: string) {
  return apiPost("/portfolio/safe/deposit", { amount }, token)
}
