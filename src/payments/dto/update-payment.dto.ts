import { PartialType } from "@nestjs/swagger";
import { CreatePaymentDto } from "./create-payment.dto";
import { IsEnum, IsOptional } from "class-validator";
import { PaymentStatus } from "@prisma/client";

export class UpdatePaymentDto extends PartialType(CreatePaymentDto) {
  @IsEnum(PaymentStatus)
  @IsOptional()
  status?: PaymentStatus;
}
