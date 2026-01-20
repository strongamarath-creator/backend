import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { UsersService } from "../users/users.service";
import { JwtService } from "@nestjs/jwt";
import { NotificationService } from "../notifications/notification.service";
import { UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcryptjs";

describe("AuthService Security", () => {
  let service: AuthService;
  let usersService: Partial<Record<keyof UsersService, jest.Mock>>;
  let jwtService: Partial<Record<keyof JwtService, jest.Mock>>;
  let notificationService: Partial<
    Record<keyof NotificationService, jest.Mock>
  >;

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      findByPhone: jest.fn(),
      findByIdWithPassword: jest.fn(),
      updatePassword: jest.fn(),
    };
    jwtService = {
      sign: jest.fn(),
    };
    notificationService = {
      sendEmail: jest.fn(),
      sendSms: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: NotificationService, useValue: notificationService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it("should throw 'Invalid credentials' when user is not found (prevent enumeration)", async () => {
    usersService.findByEmail.mockResolvedValue(null);

    await expect(
      service.login({ email: "nonexistent@example.com", password: "password" }),
    ).rejects.toThrow(UnauthorizedException);

    try {
      await service.login({
        email: "nonexistent@example.com",
        password: "password",
      });
    } catch (e) {
      // We assert on the message to ensure it doesn't say "User not found"
      if (e instanceof Error) {
        expect(e.message).toBe("Invalid credentials");
      }
    }
  });

  it("should throw 'Invalid credentials' when password is incorrect", async () => {
    const hashedPassword = await bcrypt.hash("correct-password", 10);
    usersService.findByEmail.mockResolvedValue({
      id: 1,
      email: "existing@example.com",
      password: hashedPassword,
    });

    await expect(
      service.login({
        email: "existing@example.com",
        password: "wrong-password",
      }),
    ).rejects.toThrow(UnauthorizedException);

    try {
      await service.login({
        email: "existing@example.com",
        password: "wrong-password",
      });
    } catch (e) {
      if (e instanceof Error) {
        expect(e.message).toBe("Invalid credentials");
      }
    }
  });
});
