import { ApiProperty } from "@nestjs/swagger";
import { UserProfileDto } from "./user-profile.dto";

export class AuthRegisterResponseDto extends UserProfileDto {
  @ApiProperty({ example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." })
  accessToken: string;
}
