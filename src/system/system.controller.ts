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
import {
  ApiTags,
  ApiResponse,
  ApiOperation,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { SystemService } from "./system.service";
import {
  CreateSystemConfigDto,
  UpdateSystemConfigDto,
} from "./dto/create-system-config.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AdminGuard } from "../auth/guards/admin.guard";

@ApiTags("system")
@Controller("system")
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Get("health")
  @ApiOperation({ summary: "Check system health" })
  @ApiResponse({ status: 200, description: "System health status" })
  getHealth() {
    return this.systemService.getHealth();
  }

  @Post("configs")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({ summary: "Create a new configuration" })
  create(@Body() createConfigDto: CreateSystemConfigDto) {
    return this.systemService.create(createConfigDto);
  }

  @Get("configs")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({ summary: "Get all configurations" })
  findAll() {
    return this.systemService.findAll();
  }

  @Get("configs/:key")
  @ApiOperation({ summary: "Get a configuration by key" })
  findOne(@Param("key") key: string) {
    return this.systemService.findOne(key);
  }

  @Patch("configs/:key")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({ summary: "Update a configuration" })
  update(
    @Param("key") key: string,
    @Body() updateConfigDto: UpdateSystemConfigDto,
  ) {
    return this.systemService.update(key, updateConfigDto);
  }

  @Delete("configs/:key")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiOperation({ summary: "Delete a configuration" })
  remove(@Param("key") key: string) {
    return this.systemService.remove(key);
  }
}
