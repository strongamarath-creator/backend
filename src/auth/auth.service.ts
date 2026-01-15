import { Injectable, UnauthorizedException } from "@nestjs/common";
import { UsersService } from "../users/users.service";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { LoginDto } from "./dto/login.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { User } from "@prisma/client";
import { NotificationService } from "../notifications/notification.service";
import * as crypto from "crypto";

@Injectable()
export class AuthService {
  private readonly dummyHash: string;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private notificationService: NotificationService,
  ) {
    // Generate a dummy hash for constant-time comparison on failed lookups
    this.dummyHash = bcrypt.hashSync("dummyPasswordForTimingAttacks", 10);
  }

  async validateUser(
    identifier: string,
    pass: string,
  ): Promise<Omit<User, "password"> | null> {
    const isEmail = identifier.includes("@");
    let user: User | null;

    if (isEmail) {
      user = await this.usersService.findByEmail(identifier);
    } else {
      user = await this.usersService.findByPhone(identifier);
    }

    if (user) {
      const isPasswordValid = await bcrypt.compare(pass, user.password);
      if (isPasswordValid) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...result } = user;
        return result;
      }
    } else {
      // Simulate comparison time to prevent timing attacks (user existence enumeration)
      await bcrypt.compare(pass, this.dummyHash);
    }

    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

  async recoverAccount(identifier: string) {
    const isEmail = identifier.includes("@");
    let user: User | null;
    if (isEmail) {
      user = await this.usersService.findByEmail(identifier);
    } else {
      user = await this.usersService.findByPhone(identifier);
    }

    if (!user) {
      return { message: "If account exists, recovery code sent." };
    }

    const code = crypto.randomInt(100000, 1000000).toString();

    if (isEmail) {
      await this.notificationService.sendEmail(
        user.email,
        "Recovery Code",
        `Your code: ${code}`,
      );
    } else if (user.phoneNumber) {
      await this.notificationService.sendSms(
        user.phoneNumber,
        `Your code: ${code}`,
      );
    }

    return { message: "If account exists, recovery code sent." };
  }

  async changePassword(userId: number, changePasswordDto: ChangePasswordDto) {
    // ИСПРАВЛЕНИЕ ЗДЕСЬ:
    // Мы используем findByIdWithPassword вместо findOne.
    // findOne возвращал объект БЕЗ поля password (из-за select), что вызывало ошибку.
    const user = await this.usersService.findByIdWithPassword(userId);

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    // Дополнительная проверка безопасности на случай, если у пользователя в БД нет пароля
    if (!user.password) {
      throw new UnauthorizedException("User has no password set");
    }

    const isPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid current password");
    }

    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);
    await this.usersService.updatePassword(userId, hashedPassword);

    return { message: "Password updated successfully" };
  }
}
