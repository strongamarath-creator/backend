import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
} from "@nestjs/common";
import { RequestWithUser } from "../common/types";
import { ChatService } from "./chat.service";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
} from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { MessageDto } from "./dto/message.dto";

@ApiTags("chat")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
@Controller("chat")
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get("messages/:userId")
  @ApiOperation({ summary: "Get message history with a user" })
  @ApiOkResponse({ type: [MessageDto] })
  async getMessages(
    @Request() req: RequestWithUser,
    @Param("userId", ParseIntPipe) otherUserId: number,
  ): Promise<MessageDto[]> {
    return this.chatService.findAll(req.user.userId, otherUserId);
  }
}
