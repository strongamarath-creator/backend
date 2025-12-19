import { ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { SystemService } from "../system/system.service";
import {
  type ChatMessageType,
  type EffectiveEntitlements,
  type EntitlementsSummary,
  type SubscriptionPoliciesConfig,
  type SubscriptionTier,
  type TierPolicy,
} from "./entitlements.types";

const DEFAULT_POLICIES: Record<SubscriptionTier, TierPolicy> = {
  FREE: {
    messaging: { enabled: true, dailyTextLimit: 30, mediaEnabled: false },
    calls: { audio: false, video: false },
  },
  TIER1: {
    messaging: { enabled: true, dailyTextLimit: 0, mediaEnabled: true },
    calls: { audio: true, video: false },
  },
  TIER2: {
    messaging: { enabled: true, dailyTextLimit: 0, mediaEnabled: true },
    calls: { audio: true, video: true },
  },
  TIER3: {
    messaging: { enabled: true, dailyTextLimit: 0, mediaEnabled: true },
    calls: { audio: true, video: true },
  },
};

function isSubscriptionTier(value: string): value is SubscriptionTier {
  return (
    value === "FREE" ||
    value === "TIER1" ||
    value === "TIER2" ||
    value === "TIER3"
  );
}

function normalizeSubscriptionTier(
  value: string | null | undefined,
): SubscriptionTier {
  if (!value) return "FREE";

  if (isSubscriptionTier(value)) return value;

  const upper = value.toUpperCase();
  if (upper === "SILVER") return "TIER1";
  if (upper === "GOLD") return "TIER2";
  if (upper === "PLATINUM") return "TIER3";
  if (upper === "FREE") return "FREE";

  return "FREE";
}

function toIsoDate(value: Date | null | undefined): string | undefined {
  return value ? value.toISOString() : undefined;
}

@Injectable()
export class EntitlementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly systemService: SystemService,
  ) {}

  private async loadPolicies(): Promise<Record<SubscriptionTier, TierPolicy>> {
    const raw = await this.systemService.getConfig("subscription_policies");
    if (!raw) return DEFAULT_POLICIES;

    try {
      const parsed = JSON.parse(raw) as SubscriptionPoliciesConfig;
      return {
        FREE: parsed.FREE ?? DEFAULT_POLICIES.FREE,
        TIER1: parsed.TIER1 ?? DEFAULT_POLICIES.TIER1,
        TIER2: parsed.TIER2 ?? DEFAULT_POLICIES.TIER2,
        TIER3: parsed.TIER3 ?? DEFAULT_POLICIES.TIER3,
      };
    } catch {
      return DEFAULT_POLICIES;
    }
  }

  async getEffectiveEntitlementsForUser(
    userId: number,
  ): Promise<EffectiveEntitlements> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionTier: true,
        subscriptionStartedAt: true,
        subscriptionExpiresAt: true,
        messagingBlocked: true,
      },
    });

    const now = new Date();
    const normalizedTier = normalizeSubscriptionTier(user?.subscriptionTier);
    const isExpired =
      !!user?.subscriptionExpiresAt && user.subscriptionExpiresAt <= now;

    const tier: SubscriptionTier = isExpired ? "FREE" : normalizedTier;

    const policies = await this.loadPolicies();
    const policy = policies[tier];

    const messagingEnabled =
      policy.messaging.enabled && !(user?.messagingBlocked ?? false);

    return {
      tier,
      messaging: {
        enabled: messagingEnabled,
        reason: !policy.messaging.enabled
          ? "TIER_DISABLED"
          : user?.messagingBlocked
            ? "BLOCKED"
            : undefined,
        dailyTextLimit: policy.messaging.dailyTextLimit,
        mediaEnabled: policy.messaging.mediaEnabled,
      },
      calls: {
        audio: policy.calls.audio,
        video: policy.calls.video,
      },
    };
  }

  async getEntitlementsSummaryForUser(
    userId: number,
  ): Promise<EntitlementsSummary> {
    const [entitlements, user, policies] = await Promise.all([
      this.getEffectiveEntitlementsForUser(userId),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          subscriptionTier: true,
          subscriptionStartedAt: true,
          subscriptionExpiresAt: true,
        },
      }),
      this.loadPolicies(),
    ]);

    const now = new Date();
    const normalizedTier = normalizeSubscriptionTier(user?.subscriptionTier);
    const expiresAt = user?.subscriptionExpiresAt ?? null;

    const status =
      normalizedTier === "FREE"
        ? "NONE"
        : expiresAt && expiresAt <= now
          ? "EXPIRED"
          : "ACTIVE";

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const usedTextToday = await this.prisma.message.count({
      where: {
        senderId: userId,
        type: "TEXT",
        createdAt: { gte: start, lt: end },
      },
    });

    const dailyLimit = entitlements.messaging.dailyTextLimit;
    const remainingTextToday =
      dailyLimit <= 0 ? null : Math.max(0, dailyLimit - usedTextToday);

    return {
      ...entitlements,
      subscription: {
        status,
        tier: entitlements.tier,
        purchasedAt: toIsoDate(user?.subscriptionStartedAt ?? undefined),
        expiresAt: toIsoDate(user?.subscriptionExpiresAt ?? undefined),
      },
      usage: {
        messaging: { usedTextToday, remainingTextToday },
      },
      policies,
    };
  }

  private async assertDailyTextLimit(senderId: number, limit: number) {
    if (limit <= 0) return;

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const count = await this.prisma.message.count({
      where: {
        senderId,
        type: "TEXT",
        createdAt: { gte: start, lt: end },
      },
    });

    if (count >= limit) {
      throw new ForbiddenException("Daily message limit reached.");
    }
  }

  async assertCanSendMessage(senderId: number, messageType: ChatMessageType) {
    const ent = await this.getEffectiveEntitlementsForUser(senderId);
    if (!ent.messaging.enabled) {
      throw new ForbiddenException(
        "Messaging is not available for your account.",
      );
    }

    if (messageType !== "TEXT" && !ent.messaging.mediaEnabled) {
      throw new ForbiddenException(
        "Media messages are not available for your subscription tier.",
      );
    }

    if (messageType === "TEXT") {
      await this.assertDailyTextLimit(senderId, ent.messaging.dailyTextLimit);
    }
  }

  async assertCanCall(callerId: number, calleeId: number, isVideo: boolean) {
    const [callerEnt, calleeEnt] = await Promise.all([
      this.getEffectiveEntitlementsForUser(callerId),
      this.getEffectiveEntitlementsForUser(calleeId),
    ]);

    const required = isVideo ? "video" : "audio";

    if (!callerEnt.calls[required]) {
      throw new ForbiddenException(
        "Calls are not available for your subscription tier.",
      );
    }

    if (!calleeEnt.calls[required]) {
      throw new ForbiddenException(
        "This user cannot receive calls for their subscription tier.",
      );
    }
  }
}
