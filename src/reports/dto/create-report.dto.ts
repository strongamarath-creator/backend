import { IsNotEmpty, IsString, IsInt, IsOptional } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateReportDto {
  @ApiProperty({
    description: "ID пользователя, на которого подается жалоба",
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  reportedUserId: number;

  @ApiProperty({ description: "Причина жалобы" })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiPropertyOptional({ description: "Дополнительное описание" })
  @IsOptional()
  @IsString()
  description?: string;
}
