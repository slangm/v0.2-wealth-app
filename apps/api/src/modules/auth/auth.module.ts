import { Module } from "@nestjs/common"
import { UsersModule } from "../users/users.module"
import { GoogleAuthService } from "./google-auth.service"
import { AuthService } from "./auth.service"
import { AuthController } from "./auth.controller"
import { JwtAuthGuard } from "./jwt.guard"

@Module({
  imports: [UsersModule],
  providers: [GoogleAuthService, AuthService, JwtAuthGuard],
  controllers: [AuthController],
  exports: [AuthService, JwtAuthGuard, UsersModule],
})
export class AuthModule {}
