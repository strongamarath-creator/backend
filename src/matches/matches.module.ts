import { Module } from "@nestjs/common";
import { MatchesService } from "./matches.service";
import { MatchesController } from "./matches.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { SystemModule } from "../system/system.module";
import { ChatModule } from "../chat/chat.module";

@Module({
  imports: [PrismaModule, SystemModule, ChatModule],
  controllers: [MatchesController],
  providers: [MatchesService],
})
export class MatchesModule {}
