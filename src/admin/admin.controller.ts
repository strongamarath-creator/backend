import {
  Controller,
  Get,
  Param,
  UseGuards,
  Patch,
  Body,
  ParseIntPipe,
} from "@nestjs/common";
import { ChatService } from "../chat/chat.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { UsersService } from "../users/users.service";
import { PrismaService } from "../prisma/prisma.service";
import { AdminGuard } from "../auth/guards/admin.guard";

@Controller("admin")
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(
    private chatService: ChatService,
    private usersService: UsersService,
    private prisma: PrismaService,
  ) {}

  // Read user messages (decrypted)
  @Get("users/:id/messages")
  async getUserMessages(@Param("id", ParseIntPipe) id: number) {
    // In a real guard, we would get user from request, but here we assume the guard did it.
    // NOTE: We need request object to check admin role.
    // Assuming global admin check or added logic.
    // For strictness, let's inject Request.
    return this.chatService.getAdminUserMessages(String(id));
  }

  // Block/Unblock Messaging
  @Patch("users/:id/messaging-block")
  async toggleMessagingBlock(
    @Param("id", ParseIntPipe) id: number,
    @Body("blocked") blocked: boolean,
  ) {
    return this.prisma.user.update({
      where: { id: id },
      data: { messagingBlocked: blocked },
    });
  }

  // Set Subscription Tier
  @Patch("users/:id/subscription")
  async setSubscription(
    @Param("id", ParseIntPipe) id: number,
    @Body("tier") tier: string,
  ) {
    return this.prisma.user.update({
      where: { id: id },
      data: { subscriptionTier: tier },
    });
  }
}
