import { Module, forwardRef } from "@nestjs/common";
import { WalletService } from "./wallet.service";
import { WalletController } from "./wallet.controller";
import { UsersModule } from "../users/users.module";
import { ComplianceModule } from "../compliance/compliance.module";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [UsersModule, ComplianceModule, forwardRef(() => AuthModule)],
  providers: [WalletService],
  controllers: [WalletController],
  exports: [WalletService],
})
export class WalletModule {}
