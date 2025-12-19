// backend/src/prisma/prisma.service.ts
import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private connectionPool: Pool;

  constructor() {
    // 1. Инициализируем пул соединений PostgreSQL
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is missing");
    }

    const pool = new Pool({
      connectionString,
      max: parseInt(process.env.DB_POOL_SIZE || "20", 10), // Configurable pool size
      idleTimeoutMillis: 30000, // Закрывать неактивные соединения через 30 сек
    });

    // 2. Создаем адаптер Prisma
    const adapter = new PrismaPg(pool);

    // 3. Передаем адаптер в конструктор PrismaClient
    super({
      adapter,
      // Логирование запросов (опционально)
      log:
        process.env.NODE_ENV === "development"
          ? ["query", "info", "warn", "error"]
          : ["error"],
    });

    this.connectionPool = pool;
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log("Prisma подключена к базе данных через адаптер PrismaPg");
    } catch (error) {
      this.logger.error("Ошибка подключения к БД", error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    // Закрываем пул при остановке приложения
    await this.connectionPool.end();
    this.logger.log("Пул соединений с БД закрыт");
  }
}
