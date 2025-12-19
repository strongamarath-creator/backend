import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateInAppNotificationDto {
  @IsString()
  @MaxLength(500)
  message!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @IsIn(["success", "error", "info"])
  variant?: "success" | "error" | "info";

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  detailsJson?: string;
}
