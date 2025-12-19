import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class PaymentDto {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: Number })
  userId: number;

  @ApiProperty({ type: Number })
  amount: number;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  provider: string;

  @ApiPropertyOptional({ nullable: true })
  transactionId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  tier?: string | null;

  @ApiPropertyOptional({ nullable: true, type: String, format: "date-time" })
  expiresAt?: string | null;

  @ApiProperty({ type: String, format: "date-time" })
  createdAt: string;
}
