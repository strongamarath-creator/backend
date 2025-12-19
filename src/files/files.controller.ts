import {
  Controller,
  Get,
  Post,
  Param,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Req,
  Res,
  ForbiddenException,
  NotFoundException,
  Body,
  Patch,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname, join, basename } from "path";
import { Request, Response } from "express";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PrismaService } from "../prisma/prisma.service";
import * as sharp from "sharp";

interface AuthenticatedRequest extends Request {
  user: {
    userId: number;
  };
}

const storage = diskStorage({
  destination: (req: Request, file, cb) => {
    // Cast req to properly typed request
    const authenticatedReq = req as unknown as AuthenticatedRequest;

    if (!authenticatedReq.user || !authenticatedReq.user.userId) {
      return cb(new Error("User not authenticated"), "");
    }
    const userId = authenticatedReq.user.userId;
    const uploadPath = `./uploads/${userId}`;
    if (!existsSync(uploadPath)) {
      mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

@Controller("uploads")
export class FilesController {
  constructor(private prisma: PrismaService) {}

  // Загрузка фото/видео с автоматическим сжатием (только для фото)
  @Post("upload")
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor("file", { storage }))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: AuthenticatedRequest,
  ) {
    if (!file) {
      throw new Error("File is empty");
    }
    const userId = req.user.userId;
    const filePath = join(
      process.cwd(),
      "uploads",
      String(userId),
      file.filename,
    );
    const mimeType = file.mimetype;

    // Process image
    if (mimeType.startsWith("image/")) {
      try {
        const buffer = await sharp(filePath)
          .resize({ width: 1024, withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toBuffer();

        writeFileSync(filePath, buffer);
      } catch (e) {
        console.error("Error processing image with sharp:", e);
      }
    }

    const fileUrl = `/uploads/${userId}/${file.filename}`;

    // NOTE: Prisma + SQLite hack for arrays
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { photos: true },
    });
    if (!user) throw new NotFoundException("User not found");

    if (mimeType.startsWith("image/")) {
      // Also persist into normalized UserPhoto table
      try {
        const order = user.photos.length;
        const shouldBeAvatar = !user.avatarUrl && order === 0;

        await this.prisma.userPhoto.create({
          data: {
            userId,
            url: fileUrl,
            order,
            isActive: true,
            isAvatar: shouldBeAvatar,
            visibility: "PUBLIC",
            moderationStatus: "APPROVED",
          },
        });

        if (shouldBeAvatar) {
          await this.prisma.user.update({
            where: { id: userId },
            data: { avatarUrl: fileUrl },
          });
        }
      } catch {
        // If prisma schema/migration is not deployed yet, do not break upload
      }
    } else if (mimeType.startsWith("video/")) {
      await this.prisma.userMedia.create({
        data: {
          userId,
          url: fileUrl,
          type: "VIDEO",
          visibility: "PUBLIC",
          moderationStatus: "APPROVED",
        },
      });
    }

    let photoId: number | null = null;
    if (mimeType.startsWith("image/")) {
      try {
        const row = await this.prisma.userPhoto.findUnique({
          where: {
            userId_url: {
              userId,
              url: fileUrl,
            },
          },
          select: { id: true },
        });
        photoId = row?.id ?? null;
      } catch {
        photoId = null;
      }
    }

    return {
      url: fileUrl,
      photoId,
      type: mimeType.startsWith("video/") ? "video" : "image",
    };
  }

  // Получение фото/видео с проверкой прав
  @Get(":targetUserId/:filename")
  @UseGuards(JwtAuthGuard)
  async serveFile(
    @Param("targetUserId") targetUserId: string,
    @Param("filename") filename: string,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    const currentUserId = req.user.userId;
    const targetIdNum = Number(targetUserId);

    // Validate filename to prevent traversal
    const safeFilename = basename(filename);
    if (safeFilename !== filename) {
      throw new ForbiddenException("Invalid filename");
    }

    // 1. Own photos
    if (currentUserId === targetIdNum) {
      return this.sendFile(targetUserId, safeFilename, res);
    }

    // 2. Check access
    const canView = await this.canViewPhotos(currentUserId, targetIdNum);
    if (!canView) {
      throw new ForbiddenException(
        "Access denied. You do not have permission to view these photos.",
      );
    }

    return this.sendFile(targetUserId, safeFilename, res);
  }

  private sendFile(userId: string, filename: string, res: Response) {
    const filePath = join(process.cwd(), "uploads", userId, filename);
    if (!existsSync(filePath)) {
      throw new NotFoundException("File not found");
    }
    return res.sendFile(filePath);
  }

  private async canViewPhotos(
    currentUserId: number,
    targetUserId: number,
  ): Promise<boolean> {
    // 1. Check if user is Admin
    const currentUser = await this.prisma.user.findUnique({
      where: { id: currentUserId },
    });
    if (currentUser?.role === "ADMIN") return true;

    // Check Config
    const config = await this.prisma.systemConfig.findUnique({
      where: { key: "PHOTO_ACCESS_MODE" },
    });
    if (config?.value === "PUBLIC") return true;

    // 2. Target Liked Me? (Photos of those who liked him)
    // Swipe: from=target, to=current, isLike=true
    const likedMe = await this.prisma.swipe.findFirst({
      where: {
        fromUserId: targetUserId,
        toUserId: currentUserId,
        isLike: true,
      },
    });
    if (likedMe) return true;

    // 3. Mutual Like? (Match exists OR two swipes)
    // Check Match table first (optimization)
    const match = await this.prisma.match.findFirst({
      where: {
        OR: [
          { user1Id: currentUserId, user2Id: targetUserId },
          { user1Id: targetUserId, user2Id: currentUserId },
        ],
      },
    });
    if (match) return true;

    // Double check mutual swipes if Match logic isn't strictly enforced yet
    const I_liked = await this.prisma.swipe.findFirst({
      where: {
        fromUserId: currentUserId,
        toUserId: targetUserId,
        isLike: true,
      },
    });
    if (likedMe && I_liked) return true;

    // 4. "Viewing questionnaire... regulated by rules" (Discovery/Browsing)
    // If I have NOT swiped on them yet (neither like nor dislike), I should be able to see photos to decide.
    // Also check preferences.

    // Check if I already swiped them
    const alreadySwiped = await this.prisma.swipe.findFirst({
      where: {
        fromUserId: currentUserId,
        toUserId: targetUserId,
      },
    });

    if (!alreadySwiped) {
      // I haven't swiped them yet. Are they a valid candidate?
      // Check gender preference match (if implemented)
      const targetUser = await this.prisma.user.findUnique({
        where: { id: targetUserId },
      });
      if (!targetUser) return false;

      // Simple discovery logic: If they are not blocked/reported, allow view for discovery.
      // Also check if current user has permission to view profiles (e.g. not banned)
      // Assuming active user can browse.
      return true;
    }

    // If I already swiped them:
    // If I Liked them (but they haven't liked back yet -> not mutual), usually I can still see their profile in "Pending".
    if (alreadySwiped.isLike) {
      return true;
    }

    // If I Disliked them, I probably shouldn't see them anymore, unless I have a "Rewind" feature.
    // But for now, let's say NO.

    return false;
  }

  // PATCH: выбор главного фото (аватара)
  @Patch("avatar")
  @UseGuards(JwtAuthGuard)
  async setAvatar(
    @Req() req: AuthenticatedRequest,
    @Body("photoUrl") photoUrl: string,
  ) {
    const userId = req.user.userId;
    // Проверяем, что фото принадлежит пользователю
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Verify the photoUrl contains the userId to ensure it's their folder
    // e.g. /uploads/123/img.jpg
    const expectedPrefix = `/uploads/${userId}/`;
    if (!photoUrl.startsWith(expectedPrefix)) {
      throw new ForbiddenException("Photo does not belong to user folder");
    }

    // Also check if it is in the photos array
    const photo = await this.prisma.userPhoto.findUnique({
      where: {
        userId_url: {
          userId,
          url: photoUrl,
        },
      },
    });

    if (!photo) {
      throw new ForbiddenException("Photo is not in your list");
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: photoUrl },
    });

    // Also mark avatar in normalized table (best-effort)
    try {
      await this.prisma.userPhoto.updateMany({
        where: { userId },
        data: { isAvatar: false },
      });

      await this.prisma.userPhoto.upsert({
        where: {
          userId_url: {
            userId,
            url: photoUrl,
          },
        },
        update: {
          isActive: true,
          isAvatar: true,
          order: 0,
          visibility: "PUBLIC",
        },
        create: {
          userId,
          url: photoUrl,
          isActive: true,
          isAvatar: true,
          order: 0,
          visibility: "PUBLIC",
          moderationStatus: "APPROVED",
        },
      });
    } catch {
      // ignore (migration might not be applied yet)
    }

    return { avatarUrl: photoUrl };
  }
}
