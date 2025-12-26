import { PartialType } from "@nestjs/swagger";
import { CreateReportDto } from "./create-report.dto";
import { IsEnum, IsOptional, IsString } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { ReportStatus } from "@prisma/client";

export class UpdateReportDto extends PartialType(CreateReportDto) {
  @ApiPropertyOptional({ enum: ReportStatus, description: "Статус жалобы" })
  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;

  @ApiPropertyOptional({ description: "Заметки администратора" })
  @IsOptional()
  @IsString()
  adminNotes?: string;
}
