export type UserRegion = "US" | "CN" | "AR" | "GLOBAL" | string
export type RiskPreference = "secure-first" | "balanced" | "growth" | string

export type User = {
  id: string
  googleId: string
  email: string
  name?: string
  region?: UserRegion
  riskPreference?: RiskPreference
  createdAt: string
  updatedAt: string
}
