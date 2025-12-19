import {
  IsIn,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

const MESSAGE_TYPES = ["TEXT", "IMAGE", "AUDIO", "VIDEO", "CALL_LOG"] as const;
export type MessageType = (typeof MESSAGE_TYPES)[number];

export class CreateMessageDto {
  @ApiProperty({ example: "123" })
  @IsNumberString()
  @IsNotEmpty()
  receiverId: string;

  @ApiProperty({ example: "Hello!" })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ enum: MESSAGE_TYPES })
  @IsOptional()
  @IsString()
  @IsIn(MESSAGE_TYPES)
  type?: MessageType;
}
