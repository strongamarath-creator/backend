export type SubscriptionTier = "FREE" | "TIER1" | "TIER2" | "TIER3";

export type ChatMessageType = "TEXT" | "IMAGE" | "AUDIO" | "VIDEO" | "CALL_LOG";

export interface SubscriptionPoliciesConfig {
  FREE?: TierPolicy;
  TIER1?: TierPolicy;
  TIER2?: TierPolicy;
  TIER3?: TierPolicy;
  [key: string]: TierPolicy | undefined;
}

export interface TierPolicy {
  messaging: {
    enabled: boolean;
    dailyTextLimit: number; // 0 = unlimited
    mediaEnabled: boolean;
  };
  calls: {
    audio: boolean;
    video: boolean;
  };
}

export interface EffectiveEntitlements {
  tier: SubscriptionTier;
  messaging: {
    enabled: boolean;
    reason?: "BLOCKED" | "TIER_DISABLED" | "DAILY_LIMIT";
    dailyTextLimit: number;
    mediaEnabled: boolean;
  };
  calls: {
    audio: boolean;
    video: boolean;
  };
}

export type SubscriptionStatus = "NONE" | "ACTIVE" | "EXPIRED";

export interface SubscriptionInfo {
  status: SubscriptionStatus;
  tier: SubscriptionTier;
  purchasedAt?: string;
  expiresAt?: string;
}

export interface EntitlementsUsage {
  messaging: {
    usedTextToday: number;
    remainingTextToday: number | null; // null = unlimited
  };
}

export type EntitlementsSummary = EffectiveEntitlements & {
  subscription: SubscriptionInfo;
  usage: EntitlementsUsage;
  policies: Record<SubscriptionTier, TierPolicy>;
};
