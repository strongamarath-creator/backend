import { Controller, Get, Post, Body, Param, UseGuards } from "@nestjs/common";
import { TranslationsService } from "./translations.service";
import { AdminGuard } from "../../auth/guards/admin.guard";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";

type TranslationContent = Record<string, string | object>;

@Controller("admin/translations")
@UseGuards(JwtAuthGuard, AdminGuard)
export class TranslationsController {
  constructor(private readonly translationsService: TranslationsService) {}

  @Get(":lang/:namespace")
  get(@Param("lang") lang: string, @Param("namespace") namespace: string) {
    return this.translationsService.getTranslation(lang, namespace);
  }

  @Post(":lang/:namespace")
  save(
    @Param("lang") lang: string,
    @Param("namespace") namespace: string,
    @Body() content: TranslationContent,
  ) {
    return this.translationsService.saveTranslation(lang, namespace, content);
  }
}
