import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from "@nestjs/common";
import { PagesService } from "./pages.service";
import { CreatePageDto, UpdatePageDto } from "./dto/create-page.dto";
import { AdminGuard } from "../../auth/guards/admin.guard";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";

@ApiTags("admin-pages")
@Controller("admin/pages")
export class PagesController {
  constructor(private readonly pagesService: PagesService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminGuard)
  create(@Body() createPageDto: CreatePageDto) {
    return this.pagesService.create(createPageDto);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminGuard)
  findAll() {
    return this.pagesService.findAll();
  }

  @Get(":id")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminGuard)
  findOne(@Param("id") id: string) {
    return this.pagesService.findOne(id);
  }

  @Patch(":id")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminGuard)
  update(@Param("id") id: string, @Body() updatePageDto: UpdatePageDto) {
    return this.pagesService.update(id, updatePageDto);
  }

  @Delete(":id")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminGuard)
  remove(@Param("id") id: string) {
    return this.pagesService.remove(id);
  }
}
