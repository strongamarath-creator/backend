import { Module } from "@nestjs/common";
import { ChatService } from "./chat.service";
import { ChatController } from "./chat.controller";
import { ChatGateway } from "./chat.gateway";
import { PrismaModule } from "../prisma/prisma.module";
import { EncryptionService } from "../common/encryption.service";
import { AuthModule } from "../auth/auth.module"; // Ensure AuthModule exports JwtModule or strategy if needed
import { SystemModule } from "../system/system.module";
import { EntitlementsModule } from "../entitlements/entitlements.module";

@Module({
  imports: [PrismaModule, AuthModule, SystemModule, EntitlementsModule],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway, EncryptionService],
  exports: [ChatService, ChatGateway],
})
export class ChatModule {}
