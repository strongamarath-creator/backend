import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateInAppNotificationDto } from "./dto/create-inapp-notification.dto";

const userNotificationSelect: Prisma.UserNotificationSelect = {
  id: true,
  title: true,
  message: true,
  variant: true,
  detailsJson: true,
  createdAt: true,
};

type UserNotificationView = Prisma.UserNotificationGetPayload<{
  select: typeof userNotificationSelect;
}>;

@Injectable()
export class InAppNotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  createForUser(
    userId: number,
    dto: CreateInAppNotificationDto,
  ): Promise<UserNotificationView> {
    return this.prisma.userNotification.create({
      data: {
        user: { connect: { id: userId } },
        type: "SYSTEM",
        title: dto.title,
        message: dto.message,
        variant: dto.variant ?? "info",
        detailsJson: dto.detailsJson ? JSON.parse(JSON.stringify(dto.detailsJson)) : Prisma.JsonNull,
      },
      select: userNotificationSelect,
    });
  }

  listForUser(userId: number): Promise<UserNotificationView[]> {
    return this.prisma.userNotification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: userNotificationSelect,
    });
  }

  async getForUser(userId: number, id: number): Promise<UserNotificationView> {
    const row = await this.prisma.userNotification.findFirst({
      where: { id, userId },
      select: userNotificationSelect,
    });

    if (!row) throw new NotFoundException("Notification not found");
    return row;
  }

  async deleteForUser(userId: number, id: number): Promise<{ ok: true }> {
    // Use findFirst to ensure ownership; then delete.
    const existing = await this.prisma.userNotification.findFirst({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!existing) throw new NotFoundException("Notification not found");
    if (existing.userId !== userId) throw new ForbiddenException();

    await this.prisma.userNotification.delete({ where: { id } });
    return { ok: true };
  }

  async deleteAllForUser(
    userId: number,
  ): Promise<{ ok: true; deleted: number }> {
    const res = await this.prisma.userNotification.deleteMany({
      where: { userId },
    });
    return { ok: true, deleted: res.count };
  }
}
