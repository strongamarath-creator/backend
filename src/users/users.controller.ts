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

@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(AdminGuard)
  create(@Body() createUserDto: CreateUserDto) {
    // Public registration is handled by AuthController.register
    // This endpoint is reserved for admins to create users directly.
    return this.usersService.create(createUserDto);
  }

  @Get()
  @UseGuards(AdminGuard)
  findAll(@Query("page") page?: number, @Query("limit") limit?: number) {
    // Listing all users returns sensitive PII (emails, phones) -> Admin only.
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
    // UsersService.findOne returns full profile including email/phone.
    // To prevent PII leakage, we restrict this to the owner or admin.
    // Public profile viewing should be done via MatchesController or a dedicated public endpoint.
    const isAdmin = req.user.role === "ADMIN" || req.user.role === "admin";
    if (req.user.userId !== id && !isAdmin) {
      throw new ForbiddenException(
        "You can only view your own full profile via this endpoint",
      );
    }
    return this.usersService.findOne(id);
  }

  @Patch(":id")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req: RequestWithUser,
  ) {
    const isAdmin = req.user.role === "ADMIN" || req.user.role === "admin";
    if (req.user.userId !== id && !isAdmin) {
      throw new ForbiddenException("You can only update your own profile");
    }
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(":id")
  remove(
    @Param("id", ParseIntPipe) id: number,
    @Request() req: RequestWithUser,
  ) {
    const isAdmin = req.user.role === "ADMIN" || req.user.role === "admin";
    if (req.user.userId !== id && !isAdmin) {
      throw new ForbiddenException("You can only delete your own profile");
    }
    return this.usersService.remove(id);
  }
}
