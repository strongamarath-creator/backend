import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class UserNotificationDto {
  @ApiProperty()
  id!: number;

  @ApiPropertyOptional({ nullable: true })
  title!: string | null;

  @ApiProperty()
  message!: string;

  @ApiProperty({ description: "success | error | info" })
  variant!: string;

  @ApiPropertyOptional({ nullable: true })
  detailsJson!: string | null;

  @ApiProperty()
  createdAt!: Date;
}
