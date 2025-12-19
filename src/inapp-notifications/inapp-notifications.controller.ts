import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Request,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RequestWithUser } from "../common/types";
import { CreateInAppNotificationDto } from "./dto/create-inapp-notification.dto";
import { UserNotificationDto } from "./dto/user-notification.dto";
import { InAppNotificationsService } from "./inapp-notifications.service";

@ApiTags("notifications")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("notifications")
export class InAppNotificationsController {
  constructor(private readonly service: InAppNotificationsService) {}

  @Get()
  @ApiOperation({ summary: "List current user's notifications" })
  async list(@Request() req: RequestWithUser): Promise<UserNotificationDto[]> {
    return this.service.listForUser(req.user.userId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get notification details" })
  async getOne(
    @Request() req: RequestWithUser,
    @Param("id", ParseIntPipe) id: number,
  ): Promise<UserNotificationDto> {
    return this.service.getForUser(req.user.userId, id);
  }

  @Post()
  @ApiOperation({ summary: "Create notification for current user" })
  async create(
    @Request() req: RequestWithUser,
    @Body() dto: CreateInAppNotificationDto,
  ): Promise<UserNotificationDto> {
    return this.service.createForUser(req.user.userId, dto);
  }

  @Delete()
  @ApiOperation({ summary: "Delete all current user's notifications" })
  async deleteAll(
    @Request() req: RequestWithUser,
  ): Promise<{ ok: true; deleted: number }> {
    return this.service.deleteAllForUser(req.user.userId);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete one notification" })
  async deleteOne(
    @Request() req: RequestWithUser,
    @Param("id", ParseIntPipe) id: number,
  ): Promise<{ ok: true }> {
    return this.service.deleteForUser(req.user.userId, id);
  }
}
