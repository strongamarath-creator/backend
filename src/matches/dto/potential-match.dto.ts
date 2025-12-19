import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class PotentialMatchDto {
  @ApiProperty()
  id: number;

  @ApiPropertyOptional()
  firstName?: string;

  @ApiPropertyOptional()
  lastName?: string;

  @ApiPropertyOptional({ type: [String] })
  photos?: string[];

  @ApiPropertyOptional()
  avatarUrl?: string | null;

  @ApiPropertyOptional({ type: String, description: "ISO date" })
  birthDate?: Date;

  @ApiPropertyOptional()
  age?: number;

  @ApiPropertyOptional()
  bio?: string | null;

  @ApiPropertyOptional({ type: [String] })
  interests?: string[];
}
