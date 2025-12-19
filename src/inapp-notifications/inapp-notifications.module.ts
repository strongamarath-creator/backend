import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { InAppNotificationsController } from "./inapp-notifications.controller";
import { InAppNotificationsService } from "./inapp-notifications.service";

@Module({
  imports: [PrismaModule],
  controllers: [InAppNotificationsController],
  providers: [InAppNotificationsService],
  exports: [InAppNotificationsService],
})
export class InAppNotificationsModule {}
