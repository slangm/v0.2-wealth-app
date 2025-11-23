import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common"
import type { Request } from "express"
import { UsersService } from "../users/users.service"
import { AuthService } from "./auth.service"
import type { User } from "../users/user.entity"

@Injectable()
export class JwtAuthGuard implements CanActivate {
  // Fixed dev user - matches the user from auth response
  private readonly devUser: User = {
    id: "1dddf316-af55-4d5c-84e2-b555c076f51e",
    googleId: "dev-312915703482-spimu7hd40uk6q5hlhb5mui39pejnigq.apps.googleusercontent.com",
    email: "312915703482-spimu7hd40uk6q5hlhb5mui39pejnigq.apps.googleusercontent.com@example.dev",
    name: "Dev User",
    region: "US",
    createdAt: "2025-11-22T20:30:57.369Z",
    updatedAt: "2025-11-22T20:32:24.240Z",
  }

  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>()
    const authHeader = request.headers.authorization

    // Development mode: if no token or invalid token, use dev user
    const isDevMode = process.env.NODE_ENV !== "production" || process.env.DEV_MODE === "true"

    if (!authHeader?.startsWith("Bearer ")) {
      if (isDevMode) {
        // Use dev user in development mode
        ;(request as any).user = this.devUser
        return true
      }
      throw new UnauthorizedException("Missing bearer token")
    }

    const token = authHeader.slice("Bearer ".length)
    try {
      const payload = this.authService.verifyAccessToken(token)
      const user = this.usersService.findById(payload.userId)
      if (!user) {
        if (isDevMode) {
          // Fallback to dev user if user not found in dev mode
          ;(request as any).user = this.devUser
          return true
        }
        throw new UnauthorizedException("User not found")
      }
      ;(request as any).user = user
      return true
    } catch (error) {
      if (isDevMode) {
        // In dev mode, ignore token errors and use dev user
        ;(request as any).user = this.devUser
        return true
      }
      throw new UnauthorizedException((error as Error).message)
    }
  }
}
