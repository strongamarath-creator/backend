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
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("login", () => {
    it('should throw UnauthorizedException with "Invalid credentials" if user does not exist (SECURE BEHAVIOR)', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      // Spy on bcrypt to verify timing attack mitigation (comparison should still happen)
      const compareSpy = jest.spyOn(bcrypt, "compare");

      await expect(
        service.login({ email: "test@example.com", password: "password" }),
      ).rejects.toThrow(new UnauthorizedException("Invalid credentials"));

      expect(compareSpy).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException with "Invalid credentials" if password does not match (SECURE BEHAVIOR)', async () => {
      const hashedPassword = await bcrypt.hash("correctPassword", 10);
      mockUsersService.findByEmail.mockResolvedValue({
        id: 1,
        email: "test@example.com",
        password: hashedPassword,
        role: "USER",
      });

      await expect(
        service.login({ email: "test@example.com", password: "wrongPassword" }),
      ).rejects.toThrow(new UnauthorizedException("Invalid credentials"));
    });

    it("should return access token if credentials are valid", async () => {
      const hashedPassword = await bcrypt.hash("correctPassword", 10);
      const user = {
        id: 1,
        email: "test@example.com",
        password: hashedPassword,
        role: "USER",
      };
      mockUsersService.findByEmail.mockResolvedValue(user);
      mockJwtService.sign.mockReturnValue("token");

      const result = await service.login({
        email: "test@example.com",
        password: "correctPassword",
      });

      expect(result).toEqual({ accessToken: "token" });
    });
  });
});
