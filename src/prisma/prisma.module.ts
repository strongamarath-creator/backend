// backend/src/prisma/prisma.module.ts
import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";

@Global() // Декоратор Global позволяет не импортировать модуль в каждом файле
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // Экспортируем сервис для использования в других модулях
})
export class PrismaModule {}
