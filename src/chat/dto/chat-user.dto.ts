import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class ChatUserDto {
  @ApiProperty()
  id: number;

  @ApiPropertyOptional()
  firstName?: string;

  @ApiPropertyOptional({ type: [String] })
  photos?: string[];

  @ApiPropertyOptional()
  avatarUrl?: string | null;
}
