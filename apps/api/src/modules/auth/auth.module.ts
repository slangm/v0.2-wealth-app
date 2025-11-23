import { Module, forwardRef } from "@nestjs/common";
import { UsersModule } from "../users/users.module";
import { DinariModule } from "../dinari/dinari.module";
import { GoogleAuthService } from "./google-auth.service";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { JwtAuthGuard } from "./jwt.guard";

@Module({
  imports: [UsersModule, forwardRef(() => DinariModule)],
  providers: [GoogleAuthService, AuthService, JwtAuthGuard],
  controllers: [AuthController],
  exports: [AuthService, JwtAuthGuard, UsersModule],
})
export class AuthModule {}
