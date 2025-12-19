import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsBoolean,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { ConfigType } from "@prisma/client";

export class CreateSystemConfigDto {
  @ApiProperty({ description: "Configuration key (unique identifier)" })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({ description: "Configuration value" })
  @IsString()
  @IsNotEmpty()
  value: string;

  @ApiProperty({ description: "Description of the configuration setting" })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: "Is configuration public" })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @ApiProperty({ enum: ConfigType, description: "Data type of the value" })
  @IsEnum(ConfigType)
  type: ConfigType;
}

export class UpdateSystemConfigDto {
  @ApiProperty({ description: "Configuration value" })
  @IsString()
  @IsNotEmpty()
  value: string;

  @ApiProperty({ description: "Description of the configuration setting" })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: "Is configuration public" })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @ApiProperty({ enum: ConfigType, description: "Data type of the value" })
  @IsEnum(ConfigType)
  @IsOptional()
  type?: ConfigType;
}
