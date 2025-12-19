import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export const SUBSCRIPTION_TIERS = ["FREE", "TIER1", "TIER2", "TIER3"] as const;
export type SubscriptionTierDto = (typeof SUBSCRIPTION_TIERS)[number];

export const SUBSCRIPTION_STATUSES = ["NONE", "ACTIVE", "EXPIRED"] as const;
export type SubscriptionStatusDto = (typeof SUBSCRIPTION_STATUSES)[number];

export const MESSAGING_REASONS = [
  "BLOCKED",
  "TIER_DISABLED",
  "DAILY_LIMIT",
] as const;
export type MessagingDisabledReasonDto = (typeof MESSAGING_REASONS)[number];

export class TierPolicyMessagingDto {
  @ApiProperty({ type: Boolean })
  enabled: boolean;

  @ApiProperty({ type: Number, description: "0 = unlimited" })
  dailyTextLimit: number;

  @ApiProperty({ type: Boolean })
  mediaEnabled: boolean;
}

export class TierPolicyCallsDto {
  @ApiProperty({ type: Boolean })
  audio: boolean;

  @ApiProperty({ type: Boolean })
  video: boolean;
}

export class TierPolicyDto {
  @ApiProperty({ type: TierPolicyMessagingDto })
  messaging: TierPolicyMessagingDto;

  @ApiProperty({ type: TierPolicyCallsDto })
  calls: TierPolicyCallsDto;
}

export class SubscriptionInfoDto {
  @ApiProperty({ enum: SUBSCRIPTION_STATUSES })
  status: SubscriptionStatusDto;

  @ApiProperty({ enum: SUBSCRIPTION_TIERS })
  tier: SubscriptionTierDto;

  @ApiPropertyOptional({ type: String, format: "date-time" })
  purchasedAt?: string;

  @ApiPropertyOptional({ type: String, format: "date-time" })
  expiresAt?: string;
}

export class EntitlementsUsageMessagingDto {
  @ApiProperty({ type: Number })
  usedTextToday: number;

  @ApiProperty({ type: Number, nullable: true })
  remainingTextToday: number | null;
}

export class EntitlementsUsageDto {
  @ApiProperty({ type: EntitlementsUsageMessagingDto })
  messaging: EntitlementsUsageMessagingDto;
}

export class PoliciesByTierDto {
  @ApiProperty({ type: TierPolicyDto })
  FREE: TierPolicyDto;

  @ApiProperty({ type: TierPolicyDto })
  TIER1: TierPolicyDto;

  @ApiProperty({ type: TierPolicyDto })
  TIER2: TierPolicyDto;

  @ApiProperty({ type: TierPolicyDto })
  TIER3: TierPolicyDto;
}

export class EffectiveMessagingEntitlementsDto {
  @ApiProperty({ type: Boolean })
  enabled: boolean;

  @ApiPropertyOptional({ enum: MESSAGING_REASONS })
  reason?: MessagingDisabledReasonDto;

  @ApiProperty({ type: Number })
  dailyTextLimit: number;

  @ApiProperty({ type: Boolean })
  mediaEnabled: boolean;
}

export class EffectiveCallsEntitlementsDto {
  @ApiProperty({ type: Boolean })
  audio: boolean;

  @ApiProperty({ type: Boolean })
  video: boolean;
}

export class EntitlementsSummaryDto {
  @ApiProperty({ enum: SUBSCRIPTION_TIERS })
  tier: SubscriptionTierDto;

  @ApiProperty({ type: EffectiveMessagingEntitlementsDto })
  messaging: EffectiveMessagingEntitlementsDto;

  @ApiProperty({ type: EffectiveCallsEntitlementsDto })
  calls: EffectiveCallsEntitlementsDto;

  @ApiProperty({ type: SubscriptionInfoDto })
  subscription: SubscriptionInfoDto;

  @ApiProperty({ type: EntitlementsUsageDto })
  usage: EntitlementsUsageDto;

  @ApiProperty({ type: PoliciesByTierDto })
  policies: PoliciesByTierDto;
}
