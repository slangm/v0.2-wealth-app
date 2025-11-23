import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { GoogleLoginDto } from "./dto/google-login.dto";
import { GoogleAuthService } from "./google-auth.service";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt.guard";
import { CurrentUser } from "./current-user.decorator";
import type { User } from "../users/user.entity";
import { DinariUserService } from "../dinari/dinari-user.service";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly googleAuth: GoogleAuthService,
    private readonly authService: AuthService,
    private readonly dinariUserService: DinariUserService
  ) {}

  @Post("google")
  async googleLogin(@Body() dto: GoogleLoginDto) {
    const payload = await this.googleAuth.verifyIdToken(dto.idToken);
    const user = this.authService.loginOrRegisterFromGoogle(payload, {
      region: dto.region,
      riskPreference: dto.riskPreference,
    });

    // Automatically create Dinari account for new users (async, non-blocking)
    // Check if this is a new user by checking if they already have a Dinari account
    this.dinariUserService.setupUserAccount(user.id).catch((error) => {
      // Log error but don't block login
      console.error(
        `Failed to setup Dinari account for user ${user.id}:`,
        error
      );
    });

    return {
      user,
      tokens: this.authService.issueTokens(user),
    };
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: User) {
    return user;
  }
}
