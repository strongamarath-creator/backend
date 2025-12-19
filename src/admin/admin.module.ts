import { Module } from "@nestjs/common";
import { BackupsService } from "./backups/backups.service";
import { BackupsController } from "./backups/backups.controller";
import { TranslationsService } from "./translations/translations.service";
import { TranslationsController } from "./translations/translations.controller";
import { PagesService } from "./pages/pages.service";
import { PagesController } from "./pages/pages.controller";
import { PublicPagesController } from "./pages/public-pages.controller";
import { ConfigModule } from "@nestjs/config";
import { AdminController } from "./admin.controller";
import { ChatModule } from "../chat/chat.module";
import { UsersModule } from "../users/users.module";
import { PrismaModule } from "../prisma/prisma.module";
import { SystemModule } from "../system/system.module";
import { ScriptsController } from "./scripts/scripts.controller";
import { ScriptsService } from "./scripts/scripts.service";

@Module({
  imports: [ConfigModule, ChatModule, UsersModule, PrismaModule, SystemModule],
  controllers: [
    BackupsController,
    TranslationsController,
    PagesController,
    PublicPagesController,
    AdminController,
    ScriptsController,
  ],
  providers: [
    BackupsService,
    TranslationsService,
    PagesService,
    ScriptsService,
  ],
})
export class AdminModule {}
