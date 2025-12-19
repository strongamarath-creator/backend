import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ChatUserDto } from "./chat-user.dto";

export class MessageDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  senderId: number;

  @ApiProperty()
  receiverId: number;

  @ApiProperty()
  matchId: number;

  @ApiProperty()
  content: string;

  @ApiPropertyOptional()
  type?: string;

  @ApiProperty({ type: String })
  createdAt: Date;

  @ApiProperty({ type: String })
  updatedAt: Date;

  @ApiProperty({ type: () => ChatUserDto })
  sender: ChatUserDto;

  @ApiProperty({ type: () => ChatUserDto })
  receiver: ChatUserDto;
}
