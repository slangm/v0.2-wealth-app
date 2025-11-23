import { Module, forwardRef } from "@nestjs/common";
import { DinariService } from "./dinari.service";
import { DinariController } from "./dinari.controller";
import { DinariStorageService } from "./dinari-storage.service";
import { DinariUserService } from "./dinari-user.service";
import { DinariInitService } from "./dinari-init.service";
import { AuthModule } from "../auth/auth.module";
import { WalletModule } from "../wallet/wallet.module";

@Module({
  imports: [forwardRef(() => AuthModule), WalletModule],
  controllers: [DinariController],
  providers: [
    DinariService,
    DinariStorageService,
    DinariUserService,
    DinariInitService,
  ],
  exports: [DinariService, DinariStorageService, DinariUserService],
})
export class DinariModule {}
