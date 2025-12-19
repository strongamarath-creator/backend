import { IsString, IsBoolean, IsOptional, IsJSON } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreatePageDto {
  @ApiProperty()
  @IsString()
  route: string;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  keywords?: string;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @IsJSON()
  metaJson?: string;
}

export class UpdatePageDto extends CreatePageDto {}
