-- Создание расширения PostGIS (требует прав суперпользователя в PostgreSQL)
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; -- Часто полезно

-- Создание ENUM типов
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');
CREATE TYPE "PaymentProvider" AS ENUM ('STRIPE', 'PAYPAL', 'GOOGLE_PAY', 'HUAWEI_PAY', 'APPLE_PAY', 'VK_PAY', 'YANDEX_PAY', 'T_BANK', 'SBP', 'TEST');
CREATE TYPE "SubscriptionTier" AS ENUM ('FREE', 'SILVER', 'GOLD', 'PLATINUM');
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'AUDIO', 'VIDEO');
CREATE TYPE "SwipeType" AS ENUM ('LIKE', 'DISLIKE', 'SUPERLIKE');
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'IMAGE', 'AUDIO', 'VIDEO', 'CALL_LOG', 'GIFT');
CREATE TYPE "VerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED');
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'INVESTIGATING', 'RESOLVED', 'DISMISSED');
CREATE TYPE "ConfigType" AS ENUM ('string', 'boolean', 'number', 'json', 'array');

-- Создание таблицы Users
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT,
    "email_verified" TIMESTAMP(3),
    "phone_number" TEXT,
    "phone_verified" TIMESTAMP(3),
    "password" TEXT,
    "image" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "patronymic" TEXT,
    "birthDate" TIMESTAMP(3),
    "gender" "Gender",
    "nationality" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "searchRadius" INTEGER NOT NULL DEFAULT 50,
    "isGlobalSearch" BOOLEAN NOT NULL DEFAULT false,
    "ageMinPreference" INTEGER NOT NULL DEFAULT 18,
    "ageMaxPreference" INTEGER NOT NULL DEFAULT 99,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),
    "bio" TEXT,
    "photos" TEXT[],
    "videos" TEXT[],
    "interests" TEXT[],
    "avatarUrl" TEXT,
    "height" INTEGER,
    "education" TEXT,
    "jobTitle" TEXT,
    "company" TEXT,
    "smoking" TEXT,
    "drinking" TEXT,
    "zodiac" TEXT,
    "lookingFor" TEXT,
    "genderPreference" "Gender",
    "messagingBlocked" BOOLEAN NOT NULL DEFAULT false,
    "subscriptionTier" "SubscriptionTier" NOT NULL DEFAULT 'FREE',
    "subscriptionStartedAt" TIMESTAMP(3),
    "subscriptionExpiresAt" TIMESTAMP(3),
    "callEnabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- Создание таблицы Accounts
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

-- Создание таблицы Sessions
CREATE TABLE "sessions" (
    "id" SERIAL NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- (Остальные таблицы создаются аналогично, здесь показаны ключевые изменения)

-- Уникальные индексы
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_phone_number_key" ON "users"("phone_number");
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");
CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");

-- Гео-индекс (ОЧЕНЬ ВАЖНО ДЛЯ БЫСТРОДЕЙСТВИЯ)
CREATE INDEX "users_geo_idx" ON "users" USING gist (ll_to_earth(latitude, longitude)); 
-- Или, если используем нативную геометрию (рекомендуемый способ для raw query):
-- Но так как мы оставили float поля, индекс будет по ним, или функциональный индекс.
CREATE INDEX "users_lat_long_idx" ON "users"("latitude", "longitude");

-- Внешние ключи
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;