import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  UseGuards,
  Request,
  ForbiddenException,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AdminGuard } from "../auth/guards/admin.guard";
import { RequestWithUser } from "../common/types";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

@ApiTags("users")
@Controller("users")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(AdminGuard)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @UseGuards(AdminGuard)
  findAll(@Query("page") page?: number, @Query("limit") limit?: number) {
    // Преобразуем параметры в числа, если они пришли как строки
    const pageNum = page ? Number(page) : 1;
    const limitNum = limit ? Number(limit) : undefined;

    const skip = limitNum ? (pageNum - 1) * limitNum : undefined;
    const take = limitNum;

    return this.usersService.findAll({
      skip,
      take,
    });
  }

  @Get(":id")
  findOne(
    @Param("id", ParseIntPipe) id: number,
    @Request() req: RequestWithUser,
  ) {
    // Only admin or the user themselves can view full profile details (with PII)
    if (req.user.role !== "ADMIN" && req.user.userId !== id) {
      throw new ForbiddenException("You can only view your own profile");
    }
    return this.usersService.findOne(id);
  }

  @Patch(":id")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req: RequestWithUser,
  ) {
    if (req.user.role !== "ADMIN" && req.user.userId !== id) {
      throw new ForbiddenException("You can only update your own profile");
    }
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(":id")
  remove(
    @Param("id", ParseIntPipe) id: number,
    @Request() req: RequestWithUser,
  ) {
    if (req.user.role !== "ADMIN" && req.user.userId !== id) {
      throw new ForbiddenException("You can only delete your own profile");
    }
    return this.usersService.remove(id);
  }
}
