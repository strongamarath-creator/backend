import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from "@nestjs/common";
import { RequestWithUser } from "../common/types";
import { ReportsService } from "./reports.service";
import { CreateReportDto } from "./dto/create-report.dto";
import { UpdateReportDto } from "./dto/update-report.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

@ApiTags("reports")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("reports")
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  create(
    @Request() req: RequestWithUser,
    @Body() createReportDto: CreateReportDto,
  ) {
    return this.reportsService.create(createReportDto, {
      id: req.user.userId,
    });
  }

  @Get()
  findAll() {
    return this.reportsService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.reportsService.findOne(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() updateReportDto: UpdateReportDto) {
    return this.reportsService.update(id, updateReportDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.reportsService.remove(id);
  }
}
