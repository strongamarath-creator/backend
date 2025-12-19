// Файл: backend/src/lib/prisma.ts
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

// 1. Создаем пул соединений.
// connectionString берется из вашего.env файла
const connectionString = `${process.env.DATABASE_URL}`;

// Настраиваем пул (настройки драйвера pg)
const pool = new Pool({
  connectionString,
  max: parseInt(process.env.DB_POOL_SIZE || "10", 10), // Configurable pool size
  idleTimeoutMillis: 30000, // Закрывать простойные соединения через 30 сек
});

// 2. Создаем адаптер Prisma, который связывает Prisma и PostgreSQL
const adapter = new PrismaPg(pool);

// 3. Объявляем глобальную переменную для хранения инстанса в dev-режиме
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// 4. Создаем (или берем существующий) инстанс клиента
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    // Логирование запросов в консоль (полезно при отладке)
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

// 5. Сохраняем инстанс в глобальную переменную, если мы не в продакшене
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
