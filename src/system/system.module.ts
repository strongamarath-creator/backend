import { Module } from "@nestjs/common";
import { SystemService } from "./system.service";
import { SystemController } from "./system.controller";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [SystemController],
  providers: [SystemService],
  exports: [SystemService],
})
export class SystemModule {}
