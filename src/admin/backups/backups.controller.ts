import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Res,
  UseGuards,
  StreamableFile,
} from "@nestjs/common";
import { BackupsService } from "./backups.service";
import { AdminGuard } from "../../auth/guards/admin.guard";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { createReadStream } from "fs";
import type { Response } from "express";

@Controller("admin/backups")
@UseGuards(JwtAuthGuard, AdminGuard)
export class BackupsController {
  constructor(private readonly backupsService: BackupsService) {}

  @Post()
  create() {
    return this.backupsService.createBackup();
  }

  @Get()
  findAll() {
    return this.backupsService.listBackups();
  }

  @Get(":filename")
  download(
    @Param("filename") filename: string,
    @Res({ passthrough: true }) res: Response,
  ): StreamableFile {
    const file = createReadStream(this.backupsService.getBackupPath(filename));
    res.set({
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${filename}"`,
    });
    return new StreamableFile(file);
  }

  @Delete(":filename")
  remove(@Param("filename") filename: string) {
    return this.backupsService.deleteBackup(filename);
  }
}
