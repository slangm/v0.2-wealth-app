import { Injectable, UnauthorizedException } from "@nestjs/common"
import { OAuth2Client, type TokenPayload } from "google-auth-library"

@Injectable()
export class GoogleAuthService {
  private client: OAuth2Client | null = null

  constructor() {
    const clientId = process.env.GOOGLE_CLIENT_ID
    if (clientId) {
      this.client = new OAuth2Client(clientId)
    } else {
      console.warn("[auth] GOOGLE_CLIENT_ID not set; falling back to dev-only token passthrough.")
    }
  }

  async verifyIdToken(idToken: string): Promise<TokenPayload> {
    // For local dev, allow passthrough if no client configured.
    if (!this.client) {
      return {
        sub: `dev-${idToken}`,
        email: `${idToken}@example.dev`,
        email_verified: true,
        name: "Dev User",
        iss: "local-dev",
        aud: "local-dev",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 60 * 60,
      }
    }

    const ticket = await this.client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    })
    const payload = ticket.getPayload()
    if (!payload?.sub || !payload?.email) {
      throw new UnauthorizedException("Invalid Google token payload")
    }
    return payload
  }
}
