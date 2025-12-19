import { ApiProperty } from "@nestjs/swagger";
import { MatchUserDto } from "./match-user.dto";

export class MatchDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  user1Id: number;

  @ApiProperty()
  user2Id: number;

  @ApiProperty({ type: String })
  createdAt: Date;

  @ApiProperty({ type: () => MatchUserDto })
  user1: MatchUserDto;

  @ApiProperty({ type: () => MatchUserDto })
  user2: MatchUserDto;
}
