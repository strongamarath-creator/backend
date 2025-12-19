import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { AdminGuard } from "../../auth/guards/admin.guard";
import { ScriptsService } from "./scripts.service";

@Controller("admin/scripts")
@UseGuards(JwtAuthGuard, AdminGuard)
export class ScriptsController {
  constructor(private readonly scripts: ScriptsService) {}

  @Get()
  list() {
    return { data: this.scripts.list() };
  }

  @Get("runs")
  listRuns(@Req() req: Request) {
    // req используется для возможного будущего аудита/контекста (не выбрасывать)
    void req;
    return this.scripts.listRuns(req.query);
  }

  @Get("runs/:runId")
  getRun(@Param("runId") runId: string) {
    return this.scripts.getRun(runId);
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.scripts.get(id);
  }

  @Post(":id/run")
  async run(
    @Param("id") id: string,
    @Body() payload: unknown,
    @Req() req: Request,
  ) {
    const result = await this.scripts.run(id, payload, req.user);
    return { status: "ok", result };
  }

  @Post(":id/preflight")
  async preflight(
    @Param("id") id: string,
    @Body() payload: unknown,
    @Req() req: Request,
  ) {
    const result = await this.scripts.preflight(id, payload, req.user);
    return { status: "ok", result };
  }
}
