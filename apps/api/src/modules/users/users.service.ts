import { Injectable } from "@nestjs/common"
import { randomUUID } from "crypto"
import type { RiskPreference, User, UserRegion } from "./user.entity"

@Injectable()
export class UsersService {
  private readonly store = new Map<string, User>()
  private readonly indexByGoogleId = new Map<string, string>()

  constructor() {
    // Initialize dev user if in development mode
    this.ensureDevUser()
  }

  private ensureDevUser() {
    const devUserId = "1dddf316-af55-4d5c-84e2-b555c076f51e"
    const devUser: User = {
      id: devUserId,
      googleId: "dev-312915703482-spimu7hd40uk6q5hlhb5mui39pejnigq.apps.googleusercontent.com",
      email: "312915703482-spimu7hd40uk6q5hlhb5mui39pejnigq.apps.googleusercontent.com@example.dev",
      name: "Dev User",
      region: "US",
      createdAt: "2025-11-22T20:30:57.369Z",
      updatedAt: "2025-11-22T20:32:24.240Z",
    }

    if (!this.store.has(devUserId)) {
      this.store.set(devUserId, devUser)
      this.indexByGoogleId.set(devUser.googleId, devUserId)
    }
  }

  findById(id: string) {
    return this.store.get(id) ?? null
  }

  findByGoogleId(googleId: string) {
    const id = this.indexByGoogleId.get(googleId)
    return id ? this.store.get(id) ?? null : null
  }

  upsertFromGoogle(params: {
    googleId: string
    email: string
    name?: string
    region?: UserRegion
    riskPreference?: RiskPreference
  }): User {
    const existing = this.findByGoogleId(params.googleId)
    if (existing) {
      const updated: User = {
        ...existing,
        region: params.region ?? existing.region,
        riskPreference: params.riskPreference ?? existing.riskPreference,
        updatedAt: new Date().toISOString(),
      }
      this.store.set(existing.id, updated)
      return updated
    }

    const user: User = {
      id: randomUUID(),
      googleId: params.googleId,
      email: params.email,
      name: params.name,
      region: params.region,
      riskPreference: params.riskPreference,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    this.store.set(user.id, user)
    this.indexByGoogleId.set(params.googleId, user.id)
    return user
  }

  updateRegion(userId: string, region: UserRegion) {
    const user = this.store.get(userId)
    if (!user) return null
    const next = { ...user, region, updatedAt: new Date().toISOString() }
    this.store.set(userId, next)
    return next
  }
}
