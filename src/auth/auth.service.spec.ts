import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { UsersService } from "../users/users.service";
import { JwtService } from "@nestjs/jwt";
import { NotificationService } from "../notifications/notification.service";
import { UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcryptjs";

describe("AuthService", () => {
  let service: AuthService;

  const mockUsersService = {
    findByEmail: jest.fn(),
    findByPhone: jest.fn(),
    findByIdWithPassword: jest.fn(),
    updatePassword: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockNotificationService = {
    sendEmail: jest.fn(),
    sendSms: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    // usersService = module.get<UsersService>(UsersService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("login", () => {
    it('should throw "Invalid credentials" when user does not exist', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({
          email: "nonexistent@example.com",
          password: "password",
        }),
      ).rejects.toThrow(new UnauthorizedException("Invalid credentials"));
    });

    it('should throw "Invalid credentials" when password is incorrect', async () => {
      const mockUser = {
        id: 1,
        email: "user@example.com",
        password: await bcrypt.hash("correctPassword", 10),
        role: "USER",
      };
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      await expect(
        service.login({ email: "user@example.com", password: "wrongPassword" }),
      ).rejects.toThrow(new UnauthorizedException("Invalid credentials"));
    });
  });
});
