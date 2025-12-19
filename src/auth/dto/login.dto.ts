import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class LoginDto {
  @ApiProperty({ example: "user@example.com" })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: "P@ssw0rd" })
  @IsString()
  @IsNotEmpty()
  password: string;
}
