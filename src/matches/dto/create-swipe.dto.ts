import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateSwipeDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  toUserId: number;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  isLike: boolean;

  @ApiProperty({ required: false, enum: ["LIKE", "DISLIKE", "SUPERLIKE"] })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  targetPhotoUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  targetPhotoId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  context?: string;
}
