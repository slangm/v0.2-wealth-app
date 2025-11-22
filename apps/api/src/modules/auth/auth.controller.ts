import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common"
import { GoogleLoginDto } from "./dto/google-login.dto"
import { GoogleAuthService } from "./google-auth.service"
import { AuthService } from "./auth.service"
import { JwtAuthGuard } from "./jwt.guard"
import { CurrentUser } from "./current-user.decorator"
import type { User } from "../users/user.entity"

@Controller("auth")
export class AuthController {
  constructor(
    private readonly googleAuth: GoogleAuthService,
    private readonly authService: AuthService,
  ) {}

  @Post("google")
  async googleLogin(@Body() dto: GoogleLoginDto) {
    const payload = await this.googleAuth.verifyIdToken(dto.idToken)
    const user = this.authService.loginOrRegisterFromGoogle(payload, {
      region: dto.region,
      riskPreference: dto.riskPreference,
    })
    return {
      user,
      tokens: this.authService.issueTokens(user),
    }
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: User) {
    return user
  }
}
