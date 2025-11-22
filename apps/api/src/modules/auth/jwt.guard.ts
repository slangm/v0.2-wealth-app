import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common"
import type { Request } from "express"
import { UsersService } from "../users/users.service"
import { AuthService } from "./auth.service"

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>()
    const authHeader = request.headers.authorization
    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing bearer token")
    }

    const token = authHeader.slice("Bearer ".length)
    try {
      const payload = this.authService.verifyAccessToken(token)
      const user = this.usersService.findById(payload.userId)
      if (!user) {
        throw new UnauthorizedException("User not found")
      }
      ;(request as any).user = user
      return true
    } catch (error) {
      throw new UnauthorizedException((error as Error).message)
    }
  }
}
