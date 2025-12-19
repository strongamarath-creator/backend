import { Module } from "@nestjs/common";
import { PaymentsService } from "./payments.service";
import { PaymentsController } from "./payments.controller";
import { PaymentGatewayService } from "./payment-gateway.service";
import { PrismaModule } from "../prisma/prisma.module";
import { UsersModule } from "../users/users.module";
import { SystemModule } from "../system/system.module";
import { HttpModule } from "@nestjs/axios";

@Module({
  imports: [PrismaModule, UsersModule, SystemModule, HttpModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentGatewayService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
