import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { UsersService } from "../users/users.service";
import { JwtService } from "@nestjs/jwt";
import { NotificationService } from "../notifications/notification.service";
import { UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcryptjs";

describe("AuthService", () => {
  let service: AuthService;
  let usersService: Partial<UsersService>;
  let jwtService: Partial<JwtService>;
  let notificationService: Partial<NotificationService>;

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

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("validateUser", () => {
    it("should return null if user not found", async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(null);
      const result = await service.validateUser("test@example.com", "password");
      expect(result).toBeNull();
    });

    it("should return null if password mismatch", async () => {
      const user = { email: "test@example.com", password: "hashedpassword" };
      (usersService.findByEmail as jest.Mock).mockResolvedValue(user);
      jest.spyOn(bcrypt, "compare").mockResolvedValue(false as never);

      const result = await service.validateUser("test@example.com", "password");
      expect(result).toBeNull();
    });

    it("should return user without password if validation succeeds", async () => {
      const user = {
        email: "test@example.com",
        password: "hashedpassword",
        id: 1,
      };
      (usersService.findByEmail as jest.Mock).mockResolvedValue(user);
      jest.spyOn(bcrypt, "compare").mockResolvedValue(true as never);

      const result = await service.validateUser("test@example.com", "password");
      expect(result).toEqual({ email: "test@example.com", id: 1 });
    });
  });

  describe("login", () => {
    it("should throw UnauthorizedException if user not found", async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(null);
      await expect(
        service.login({ email: "test@example.com", password: "password" }),
      ).rejects.toThrow(new UnauthorizedException("Invalid credentials"));
    });

    it("should throw UnauthorizedException if password mismatch", async () => {
      const user = { email: "test@example.com", password: "hashedpassword" };
      (usersService.findByEmail as jest.Mock).mockResolvedValue(user);
      jest.spyOn(bcrypt, "compare").mockResolvedValue(false as never);

      await expect(
        service.login({ email: "test@example.com", password: "password" }),
      ).rejects.toThrow(new UnauthorizedException("Invalid credentials"));
    });
  });
});
