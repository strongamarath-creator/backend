import { ApiProperty } from "@nestjs/swagger";

export class MatchStatsDto {
  @ApiProperty({ type: Number })
  likesCount: number;

  @ApiProperty({ type: Number })
  matchesCount: number;
}
