import { Injectable } from "@nestjs/common"

export type AuditEvent = {
  id: string
  userId?: string
  action: string
  payload?: unknown
  createdAt: string
  status?: "ok" | "error"
  details?: string
}

@Injectable()
export class AuditService {
  private readonly events: AuditEvent[] = []

  record(event: Omit<AuditEvent, "createdAt" | "id">) {
    const payload: AuditEvent = {
      ...event,
      id: `audit_${Date.now()}_${this.events.length}`,
      createdAt: new Date().toISOString(),
    }
    this.events.unshift(payload)
    this.events.splice(200) // keep recent only
    return payload
  }

  listRecent(limit = 50) {
    return this.events.slice(0, limit)
  }
}
