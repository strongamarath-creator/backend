import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { SystemModule } from "../system/system.module";
import { EntitlementsService } from "./entitlements.service";

@Module({
  imports: [PrismaModule, SystemModule],
  providers: [EntitlementsService],
  exports: [EntitlementsService],
})
export class EntitlementsModule {}
