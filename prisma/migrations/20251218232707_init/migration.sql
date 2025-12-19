-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis";

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('STRIPE', 'PAYPAL', 'GOOGLE_PAY', 'HUAWEI_PAY', 'APPLE_PAY', 'VK_PAY', 'YANDEX_PAY', 'T_BANK', 'SBP', 'TEST');

-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('FREE', 'SILVER', 'GOLD', 'PLATINUM');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'AUDIO', 'VIDEO');

-- CreateEnum
CREATE TYPE "SwipeType" AS ENUM ('LIKE', 'DISLIKE', 'SUPERLIKE', 'LOVE');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'IMAGE', 'AUDIO', 'VIDEO', 'CALL_LOG', 'GIFT');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'INVESTIGATING', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "DevicePlatform" AS ENUM ('IOS', 'ANDROID', 'HUAWEI', 'WEB');

-- CreateEnum
CREATE TYPE "ConfigType" AS ENUM ('STRING', 'BOOLEAN', 'NUMBER', 'JSON', 'ARRAY');

-- CreateEnum
CREATE TYPE "LookingFor" AS ENUM ('RELATIONSHIP', 'CASUAL', 'CHAT');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "email_verified" TIMESTAMP(3),
    "phone_number" TEXT,
    "phone_verified" TIMESTAMP(3),
    "password" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "image" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "patronymic" TEXT,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "gender" "Gender" NOT NULL,
    "nationality" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),
    "lastActiveAt" TIMESTAMP(3),
    "bio" TEXT,
    "avatarUrl" TEXT,
    "height" INTEGER,
    "education" TEXT,
    "jobTitle" TEXT,
    "company" TEXT,
    "smoking" TEXT,
    "drinking" TEXT,
    "zodiac" TEXT,
    "lookingFor" "LookingFor"[],
    "genderPreference" "Gender" NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "isBanned" BOOLEAN NOT NULL DEFAULT false,
    "messagingBlocked" BOOLEAN NOT NULL DEFAULT false,
    "callEnabled" BOOLEAN NOT NULL DEFAULT false,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "searchRadius" INTEGER NOT NULL DEFAULT 50,
    "isGlobalSearch" BOOLEAN NOT NULL DEFAULT false,
    "ageMinPreference" INTEGER NOT NULL DEFAULT 1,
    "ageMaxPreference" INTEGER NOT NULL DEFAULT 99,
    "isPassportActive" BOOLEAN NOT NULL DEFAULT false,
    "passportLat" DOUBLE PRECISION,
    "passportLon" DOUBLE PRECISION,
    "subscriptionTier" "SubscriptionTier" NOT NULL DEFAULT 'FREE',
    "subscriptionStartedAt" TIMESTAMP(3),
    "subscriptionExpiresAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "provider_profile_url" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialLogin" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "provider" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialLogin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Device" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "platform" "DevicePlatform" NOT NULL,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interest" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "iconUrl" TEXT,

    CONSTRAINT "Interest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" SERIAL NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserLocation" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "coords" geography(Point, 4326),

    CONSTRAINT "UserLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserMedia" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" "MediaType" NOT NULL DEFAULT 'VIDEO',
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "blurHash" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isAvatar" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    "moderationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPhoto" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isAvatar" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    "moderationStatus" TEXT NOT NULL DEFAULT 'APPROVED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserNotification" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "variant" TEXT NOT NULL DEFAULT 'info',
    "detailsJson" JSONB,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminScriptRun" (
    "id" SERIAL NOT NULL,
    "scriptId" TEXT NOT NULL,
    "safety" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "payloadJson" JSONB,
    "resultJson" JSONB,
    "error" TEXT,
    "actorUserId" INTEGER,
    "actorEmail" TEXT,

    CONSTRAINT "AdminScriptRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" SERIAL NOT NULL,
    "user1Id" INTEGER NOT NULL,
    "user2Id" INTEGER NOT NULL,
    "isUnmatched" BOOLEAN NOT NULL DEFAULT false,
    "unmatchedAt" TIMESTAMP(3),
    "unmatchedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "senderId" INTEGER NOT NULL,
    "receiverId" INTEGER NOT NULL,
    "matchId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "MessageType" NOT NULL DEFAULT 'TEXT',
    "metadata" JSONB,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Swipe" (
    "id" SERIAL NOT NULL,
    "fromUserId" INTEGER NOT NULL,
    "toUserId" INTEGER NOT NULL,
    "isLike" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "SwipeType" NOT NULL DEFAULT 'LIKE',
    "context" TEXT,
    "targetPhotoUrl" TEXT,
    "targetPhotoId" INTEGER,
    "targetMediaId" INTEGER,

    CONSTRAINT "Swipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" SERIAL NOT NULL,
    "reporterId" INTEGER NOT NULL,
    "reportedUserId" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "transactionId" TEXT,
    "receiptData" TEXT,
    "productType" TEXT NOT NULL,
    "tier" "SubscriptionTier",
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemConfig" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "type" "ConfigType" NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageConfig" (
    "id" SERIAL NOT NULL,
    "route" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "keywords" TEXT,
    "content" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "metaJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PageConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_InterestToUser" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_InterestToUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_number_key" ON "users"("phone_number");

-- CreateIndex
CREATE INDEX "users_last_name_first_name_patronymic_idx" ON "users"("last_name", "first_name", "patronymic");

-- CreateIndex
CREATE INDEX "users_latitude_longitude_idx" ON "users"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "users_gender_birthDate_idx" ON "users"("gender", "birthDate");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "SocialLogin_provider_providerId_key" ON "SocialLogin"("provider", "providerId");

-- CreateIndex
CREATE UNIQUE INDEX "Device_token_key" ON "Device"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Interest_name_key" ON "Interest"("name");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");

-- CreateIndex
CREATE UNIQUE INDEX "UserLocation_userId_key" ON "UserLocation"("userId");

-- CreateIndex
CREATE INDEX "location_idx" ON "UserLocation" USING GIST ("coords");

-- CreateIndex
CREATE INDEX "UserMedia_userId_order_idx" ON "UserMedia"("userId", "order");

-- CreateIndex
CREATE INDEX "UserPhoto_userId_isActive_createdAt_idx" ON "UserPhoto"("userId", "isActive", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserPhoto_userId_url_key" ON "UserPhoto"("userId", "url");

-- CreateIndex
CREATE INDEX "UserNotification_userId_createdAt_idx" ON "UserNotification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AdminScriptRun_scriptId_startedAt_idx" ON "AdminScriptRun"("scriptId", "startedAt");

-- CreateIndex
CREATE INDEX "AdminScriptRun_actorUserId_startedAt_idx" ON "AdminScriptRun"("actorUserId", "startedAt");

-- CreateIndex
CREATE INDEX "Match_user1Id_isUnmatched_idx" ON "Match"("user1Id", "isUnmatched");

-- CreateIndex
CREATE INDEX "Match_user2Id_isUnmatched_idx" ON "Match"("user2Id", "isUnmatched");

-- CreateIndex
CREATE UNIQUE INDEX "Match_user1Id_user2Id_key" ON "Match"("user1Id", "user2Id");

-- CreateIndex
CREATE INDEX "Message_matchId_sentAt_createdAt_idx" ON "Message"("matchId", "sentAt", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Swipe_fromUserId_toUserId_key" ON "Swipe"("fromUserId", "toUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_transactionId_key" ON "Payment"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "SystemConfig_key_key" ON "SystemConfig"("key");

-- CreateIndex
CREATE UNIQUE INDEX "PageConfig_route_key" ON "PageConfig"("route");

-- CreateIndex
CREATE INDEX "_InterestToUser_B_index" ON "_InterestToUser"("B");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialLogin" ADD CONSTRAINT "SocialLogin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLocation" ADD CONSTRAINT "UserLocation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMedia" ADD CONSTRAINT "UserMedia_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPhoto" ADD CONSTRAINT "UserPhoto_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserNotification" ADD CONSTRAINT "UserNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminScriptRun" ADD CONSTRAINT "AdminScriptRun_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_user1Id_fkey" FOREIGN KEY ("user1Id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_user2Id_fkey" FOREIGN KEY ("user2Id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Swipe" ADD CONSTRAINT "Swipe_targetPhotoId_fkey" FOREIGN KEY ("targetPhotoId") REFERENCES "UserPhoto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Swipe" ADD CONSTRAINT "Swipe_targetMediaId_fkey" FOREIGN KEY ("targetMediaId") REFERENCES "UserMedia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Swipe" ADD CONSTRAINT "Swipe_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reportedUserId_fkey" FOREIGN KEY ("reportedUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InterestToUser" ADD CONSTRAINT "_InterestToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Interest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InterestToUser" ADD CONSTRAINT "_InterestToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
