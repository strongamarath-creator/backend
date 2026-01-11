import { Injectable } from "@nestjs/common";
import { CreateSwipeDto } from "./dto/create-swipe.dto";
import { PrismaService } from "../prisma/prisma.service";
import { SystemService } from "../system/system.service";
import { Prisma, User, SwipeType, UserPhoto, Interest } from "@prisma/client";
import { ChatGateway } from "../chat/chat.gateway";

const matchUserSelect = {
  id: true,
  firstName: true,
  lastName: true,
  birthDate: true,
  photos: true,
  avatarUrl: true,
  bio: true,
  interests: true,
} satisfies Prisma.UserSelect;

const matchSelect = {
  id: true,
  user1Id: true,
  user2Id: true,
  createdAt: true,
  user1: { select: matchUserSelect },
  user2: { select: matchUserSelect },
} satisfies Prisma.MatchSelect;

@Injectable()
export class MatchesService {
  constructor(
    private prisma: PrismaService,
    private systemService: SystemService,
    private chatGateway: ChatGateway,
  ) {}

  async getStats(userId: string | number) {
    const id = Number(userId);
    const [likesCount, matchesCount] = await Promise.all([
      this.prisma.swipe.count({ where: { toUserId: id, isLike: true } }),
      this.prisma.match.count({
        where: { OR: [{ user1Id: id }, { user2Id: id }] },
      }),
    ]);

    return { likesCount, matchesCount };
  }

  private async emitProfileStats(userId: number) {
    const stats = await this.getStats(userId);
    this.chatGateway.emitToUser(userId, "profileStats", stats);
  }

  async swipe(fromUserId: string | number, createSwipeDto: CreateSwipeDto) {
    const { toUserId, isLike, type, targetPhotoUrl, targetPhotoId, context } =
      createSwipeDto;
    const fromId = Number(fromUserId);
    const toId = Number(toUserId);

    // Best-effort: resolve normalized targetPhotoId from url
    let resolvedTargetPhotoId: number | null =
      typeof targetPhotoId === "number" ? targetPhotoId : null;
    if (!resolvedTargetPhotoId && targetPhotoUrl) {
      try {
        const row = await this.prisma.userPhoto.findUnique({
          where: {
            userId_url: {
              userId: toId,
              url: targetPhotoUrl,
            },
          },
          select: { id: true },
        });
        resolvedTargetPhotoId = row?.id ?? null;
      } catch {
        resolvedTargetPhotoId = null;
      }
    }

    // Record the swipe
    const swipeType: SwipeType =
      (type as SwipeType) || (isLike ? SwipeType.LIKE : SwipeType.DISLIKE);
    await this.prisma.swipe.create({
      data: {
        fromUserId: fromId,
        toUserId: toId,
        isLike,
        type: swipeType,
        targetPhotoUrl,
        targetPhotoId: resolvedTargetPhotoId,
        context,
      },
    });

    if (isLike) {
      // Notify the target user that their counters changed (they got a new like)
      await this.emitProfileStats(toId);

      // Realtime event for in-browser notification ("your photo was liked")
      this.chatGateway.emitToUser(toId, "photoLiked", {
        fromUserId: fromId,
        targetPhotoUrl: targetPhotoUrl ?? null,
        swipeType: swipeType,
      });

      // Check for mutual like
      const mutualSwipe = await this.prisma.swipe.findFirst({
        where: {
          fromUserId: toId,
          toUserId: fromId,
          isLike: true,
        },
      });

      if (mutualSwipe) {
        // It's a match!
        const created = await this.prisma.match.create({
          data: {
            user1Id: fromId,
            user2Id: toId,
          },
        });

        const match = await this.prisma.match.findUnique({
          where: { id: created.id },
          select: matchSelect,
        });

        // Both users' matches counter changed
        await Promise.all([
          this.emitProfileStats(fromId),
          this.emitProfileStats(toId),
        ]);
        if (!match) return { isMatch: true };

        return {
          isMatch: true,
          match: {
            ...match,
            user1: this.transformUser(match.user1) as unknown,
            user2: this.transformUser(match.user2) as unknown,
          },
        };
      }
    }

    return { isMatch: false };
  }

  async findAllMatches(userId: string | number) {
    const id = Number(userId);
    const matches = await this.prisma.match.findMany({
      where: {
        OR: [{ user1Id: id }, { user2Id: id }],
      },
      select: matchSelect,
    });

    return matches.map((match) => ({
      ...match,
      user1: this.transformUser(match.user1) as unknown,
      user2: this.transformUser(match.user2) as unknown,
    }));
  }

  async getLikedMe(userId: string | number) {
    const id = Number(userId);
    // Find who liked me
    const swipes = await this.prisma.swipe.findMany({
      where: {
        toUserId: id,
        isLike: true,
      },
      include: {
        fromUser: {
          select: {
            id: true,
            firstName: true,
            birthDate: true,
            photos: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Transform to friendly format (add 'age', safe photos)
    return swipes.map((swipe) => ({
      ...swipe,
      fromUser: this.transformUser(swipe.fromUser),
    }));
  }

  async getLikedMeByPhoto(userId: string | number) {
    const id = Number(userId);
    const swipes = await this.prisma.swipe.findMany({
      where: {
        toUserId: id,
        isLike: true,
        targetPhotoUrl: { not: null },
      },
      select: {
        targetPhotoUrl: true,
        createdAt: true,
        fromUser: {
          select: {
            id: true,
            firstName: true,
            birthDate: true,
            photos: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const map = new Map<
      string,
      {
        photoUrl: string;
        likesCount: number;
        lastLikes: Array<{ createdAt: Date; fromUser: unknown }>;
      }
    >();

    for (const swipe of swipes) {
      const photoUrl = swipe.targetPhotoUrl || "";
      if (!photoUrl) continue;

      const existing = map.get(photoUrl) || {
        photoUrl,
        likesCount: 0,
        lastLikes: [],
      };

      existing.likesCount += 1;
      if (existing.lastLikes.length < 5) {
        existing.lastLikes.push({
          createdAt: swipe.createdAt,
          fromUser: this.transformUser(swipe.fromUser),
        });
      }

      map.set(photoUrl, existing);
    }

    return Array.from(map.values());
  }

  async getILiked(userId: string | number) {
    const id = Number(userId);
    const swipes = await this.prisma.swipe.findMany({
      where: {
        fromUserId: id,
        isLike: true,
      },
      // We cannot include toUser because relation is not defined in schema in that direction
      // See comment above
      orderBy: { createdAt: "desc" },
    });

    // Manually fetch 'toUser'
    const userIds = swipes.map((s) => s.toUserId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        firstName: true,
        birthDate: true,
        photos: true,
        avatarUrl: true,
      },
    });

    return swipes.map((swipe) => {
      const user = users.find((u) => u.id === swipe.toUserId);
      return {
        ...swipe,
        toUser: user ? this.transformUser(user) : null,
      };
    });
  }

  private transformUser(
    user: Partial<User> & { photos?: UserPhoto[]; interests?: Interest[] },
  ) {
    if (!user) return null;
    // Calc age
    const age = user.birthDate
      ? Math.floor(
          (new Date().getTime() - new Date(user.birthDate).getTime()) /
            31557600000,
        )
      : 0;

    // Handle photos
    const photos = user.photos ? user.photos.map((p) => p.url) : [];
    const interests = user.interests ? user.interests.map((i) => i.name) : [];

    // Return a safe/public shape (avoid leaking sensitive fields)
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      birthDate: user.birthDate,
      photos,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      interests,
      age,
    };
  }

  async findPotentialMatches(userId: string | number) {
    const id = Number(userId);
    // Get current user to know their location
    const currentUser = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        latitude: true,
        longitude: true,
        nationality: true,
        interests: true,
      },
    });
    if (!currentUser) return [];

    // Get IDs of users already swiped by this user
    const swipedUsers = await this.prisma.swipe.findMany({
      where: { fromUserId: id },
      select: { toUserId: true },
    });
    const swipedUserIds = swipedUsers.map((s) => s.toUserId);

    // Get max distance from config
    let maxDistance = 100; // Default 100km
    try {
      const config = await this.systemService.findOne("integration_config");
      if (config && config.value) {
        const parsed = JSON.parse(config.value) as Record<string, unknown>;
        if (
          parsed.max_distance_km &&
          typeof parsed.max_distance_km === "number"
        ) {
          maxDistance = parsed.max_distance_km;
        }
      }
    } catch {
      // Config not found, use default
    }

    // Since we use SQLite (no Trigonometry functions like acos/cos/radians built-in in standard sqlite without extensions)
    // We cannot do distance calculation in SQL query easily unless we use raw query with registered functions or fetch all.
    // Fetching all (filtered by not swiped) and filtering in memory is safer for SQLite compatibility.

    const allUsers = await this.prisma.user.findMany({
      where: {
        id: { notIn: [...swipedUserIds, id] },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        birthDate: true,
        photos: true,
        avatarUrl: true,
        latitude: true,
        longitude: true,
        nationality: true,
        interests: true,
        bio: true,
      },
    });

    const lat = currentUser.latitude;
    const lon = currentUser.longitude;

    const filtered = allUsers.filter((u) => {
      if (!lat || !lon || !u.latitude || !u.longitude) return true; // Include if location missing

      // Haversine formula in JS
      const R = 6371; // Radius of the earth in km
      const dLat = this.deg2rad(u.latitude - lat);
      const dLon = this.deg2rad(u.longitude - lon);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(this.deg2rad(lat)) *
          Math.cos(this.deg2rad(u.latitude)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const d = R * c; // Distance in km

      // We don't modify user object in place with 'as any' to avoid pollution,
      // but we rely on the filter returning boolean.

      return d <= maxDistance;
    });

    // Do not show users without photos (avoid "empty screen" cards)
    const withPhotos = filtered.filter((u) => {
      const photos = (u.photos as unknown as string[]) || [];
      return (Array.isArray(photos) && photos.length > 0) || !!u.avatarUrl;
    });

    const sorted = withPhotos.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      // Nationality Match (weight: 10)
      if (currentUser.nationality && a.nationality === currentUser.nationality)
        scoreA += 10;
      if (currentUser.nationality && b.nationality === currentUser.nationality)
        scoreB += 10;

      // Interest Overlap (weight: 5 per interest)
      const interestsA = a.interests ? a.interests.map((i) => i.name) : [];
      const interestsB = b.interests ? b.interests.map((i) => i.name) : [];
      const myInterests = currentUser.interests
        ? currentUser.interests.map((i) => i.name)
        : [];

      const commonA = interestsA.filter((i: string) =>
        myInterests.includes(i),
      ).length;
      const commonB = interestsB.filter((i: string) =>
        myInterests.includes(i),
      ).length;

      scoreA += commonA * 5;
      scoreB += commonB * 5;

      return scoreB - scoreA; // Descending
    });

    return sorted.map((u) => this.transformUser(u));
  }

  private deg2rad(deg: number) {
    return deg * (Math.PI / 180);
  }
}
