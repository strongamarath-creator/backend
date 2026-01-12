import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  NotFoundException,
  InternalServerErrorException,
  HttpException,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { CreateUserDto } from "../users/dto/create-user.dto";
import { UsersService } from "../users/users.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { RequestWithUser } from "../common/types";
import { EntitlementsService } from "../entitlements/entitlements.service";
import { UserProfileDto } from "./dto/user-profile.dto";
import { EntitlementsSummaryDto } from "../entitlements/dto/entitlements-summary.dto";
import { AuthTokenDto } from "./dto/auth-token.dto";
import { AuthRegisterResponseDto } from "./dto/auth-register-response.dto";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly entitlementsService: EntitlementsService,
  ) {}

  @Post("login")
  @ApiCreatedResponse({ type: AuthTokenDto })
  async login(@Body() loginDto: LoginDto): Promise<AuthTokenDto> {
    try {
      // Security: Do not log email addresses to avoid PII leaks in logs
      // console.log("Login attempt for:", loginDto.email);
      return await this.authService.login(loginDto);
    } catch (error: unknown) {
      // Security: Do not log sensitive error details
      // console.error("Login error in controller:", error);

      if (error instanceof HttpException) {
        if (error.getStatus() === 401) throw error;
        // Mask internal server errors
        throw new InternalServerErrorException("Login failed");
      }

      if (error instanceof Error) {
        // Mask internal server errors
        throw new InternalServerErrorException("Login failed");
      }

      throw new InternalServerErrorException("Unexpected error");
    }
  }

  @Post("register")
  @ApiCreatedResponse({ type: AuthRegisterResponseDto })
  async register(
    @Body() createUserDto: CreateUserDto,
  ): Promise<AuthRegisterResponseDto> {
    try {
      const user = await this.usersService.create(createUserDto);
      const loginResult = await this.authService.login({
        email: user.email,
        password: createUserDto.password,
      });
      return {
        ...user,
        accessToken: loginResult.accessToken,
        videos: [],
        interests: user.interests ? user.interests.map((i) => i.name) : [],
        photos: user.photos ? user.photos.map((p) => p.url) : [],
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
        birthDate: user.birthDate.toISOString(),
        subscriptionExpiresAt: user.subscriptionExpiresAt
          ? user.subscriptionExpiresAt.toISOString()
          : null,
      } as unknown as AuthRegisterResponseDto;
    } catch (error: unknown) {
      console.error("Register error in controller:", error);

      if (error instanceof HttpException) {
        throw new InternalServerErrorException(error.message);
      }

      if (error instanceof Error) {
        throw new InternalServerErrorException(error.message);
      }

      throw new InternalServerErrorException("Unexpected error");
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get("profile")
  @ApiOkResponse({ type: UserProfileDto })
  async getProfile(@Request() req: RequestWithUser) {
    const user = await this.usersService.findOne(req.user.userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return user as unknown as UserProfileDto;
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get("entitlements")
  @ApiOkResponse({ type: EntitlementsSummaryDto })
  async getEntitlements(@Request() req: RequestWithUser) {
    return (await this.entitlementsService.getEntitlementsSummaryForUser(
      req.user.userId,
    )) as unknown as EntitlementsSummaryDto;
  }
}
