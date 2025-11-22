import { Injectable } from "@nestjs/common"
import type { TokenPayload } from "google-auth-library"
import { sign, verify, type Secret, type SignOptions } from "jsonwebtoken"
import { UsersService } from "../users/users.service"
import type { User } from "../users/user.entity"

const JWT_SECRET: Secret = process.env.JWT_SECRET ?? "dev-secret"
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN ?? "1h") as SignOptions["expiresIn"]

@Injectable()
export class AuthService {
  constructor(private readonly users: UsersService) {}

  loginOrRegisterFromGoogle(payload: TokenPayload, opts?: { region?: string; riskPreference?: string }) {
    const user = this.users.upsertFromGoogle({
      googleId: payload.sub!,
      email: payload.email!,
      name: payload.name,
      region: opts?.region,
      riskPreference: opts?.riskPreference,
    })
    return user
  }

  issueTokens(user: User) {
    const accessToken = sign(
      {
        userId: user.id,
        email: user.email,
        region: user.region,
        riskPreference: user.riskPreference,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN },
    )
    return { accessToken, tokenType: "Bearer", expiresIn: JWT_EXPIRES_IN }
  }

  verifyAccessToken(token: string) {
    return verify(token, JWT_SECRET) as { userId: string; email: string; region?: string }
  }
}
