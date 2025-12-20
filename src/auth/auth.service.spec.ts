import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { UsersService } from "../users/users.service";
import { JwtService } from "@nestjs/jwt";
import { NotificationService } from "../notifications/notification.service";
import { UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcryptjs";

describe("AuthService", () => {
  let service: AuthService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let usersService: UsersService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let jwtService: JwtService;
  let notificationService: NotificationService;

  const mockUser = {
    id: 1,
    email: "test@example.com",
    password: "hashedPassword",
    role: "USER",
    phoneNumber: null as string | null,
  };

  const mockUsersService = {
    findByEmail: jest.fn(),
    findByPhone: jest.fn(),
    findByIdWithPassword: jest.fn(),
    updatePassword: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(() => "mockJwtToken"),
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
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    notificationService = module.get<NotificationService>(NotificationService);

    jest.clearAllMocks();
  });

  describe("login", () => {
    it("should throw UnauthorizedException if user not found", async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      await expect(
        service.login({ email: "test@example.com", password: "password" }),
      ).rejects.toThrow("Invalid credentials");
    });

    it("should throw UnauthorizedException if password mismatch", async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, "compare").mockImplementation(() => Promise.resolve(false));

      await expect(
        service.login({ email: "test@example.com", password: "wrongPassword" }),
      ).rejects.toThrow("Invalid credentials");
    });

    it("should return token if login successful", async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, "compare").mockImplementation(() => Promise.resolve(true));

      const result = await service.login({
        email: "test@example.com",
        password: "password",
      });
      expect(result).toHaveProperty("accessToken");
    });
  });

  describe("recoverAccount", () => {
    it("should generate a code and send email if user exists", async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      const result = await service.recoverAccount("test@example.com");
      expect(result).toEqual({ message: "Recovery code sent." });
      expect(notificationService.sendEmail).toHaveBeenCalled();
    });

    it("should return generic message if user does not exist", async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      const result = await service.recoverAccount("test@example.com");
      expect(result).toEqual({ message: "If account exists, recovery code sent." });
      expect(notificationService.sendEmail).not.toHaveBeenCalled();
    });
  });
});
