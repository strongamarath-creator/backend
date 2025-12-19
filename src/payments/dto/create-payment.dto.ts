import {
  IsNumber,
  IsString,
  IsNotEmpty,
  IsIn,
  IsOptional,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreatePaymentDto {
  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  currency: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  provider: string;

  @ApiPropertyOptional({ enum: ["TIER1", "TIER2", "TIER3"] })
  @IsOptional()
  @IsString()
  @IsIn(["TIER1", "TIER2", "TIER3"])
  tier?: "TIER1" | "TIER2" | "TIER3";
}
