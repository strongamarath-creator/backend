import { Module } from "@nestjs/common";
import { ReportsService } from "./reports.service";
import { ReportsController } from "./reports.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { UsersModule } from "../users/users.module";

@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
