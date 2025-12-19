import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { MatchDto } from "./match.dto";

export class SwipeResultDto {
  @ApiProperty()
  isMatch: boolean;

  @ApiPropertyOptional({ type: () => MatchDto })
  match?: MatchDto;
}
