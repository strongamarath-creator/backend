import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { UsersService } from "../users/users.service";
import { JwtService } from "@nestjs/jwt";
import { NotificationService } from "../notifications/notification.service";
import * as bcrypt from "bcryptjs";
import * as crypto from "crypto";

describe("AuthService Security", () => {
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
    jest.clearAllMocks();
  });

  describe("login", () => {
    it("should return generic error when user does not exist", async () => {
      // Setup: User does not exist
      mockUsersService.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.login({
          email: "nonexistent@example.com",
          password: "password",
        }),
      ).rejects.toThrow("Invalid credentials");
    });

    it("should return generic error when password is wrong", async () => {
      // Setup: User exists, wrong password
      const hashedPassword = await bcrypt.hash("correct-password", 10);
      mockUsersService.findByEmail.mockResolvedValue({
        id: 1,
        email: "exist@example.com",
        password: hashedPassword,
        role: "USER",
      });

      // Act & Assert
      await expect(
        service.login({
          email: "exist@example.com",
          password: "wrong-password",
        }),
      ).rejects.toThrow("Invalid credentials");
    });

    it("should prevent timing attacks by calling bcrypt.compare even if user not found", async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      const compareSpy = jest.spyOn(bcrypt, "compare");

      try {
        await service.login({
          email: "nonexistent@example.com",
          password: "password",
        });
      } catch {
        // expected
      }

      expect(compareSpy).toHaveBeenCalled();
    });
  });

  describe("recoverAccount", () => {
    it("should use secure random number generation", async () => {
      mockUsersService.findByEmail.mockResolvedValue({
        id: 1,
        email: "test@example.com",
        role: "USER",
      });

      const randomIntSpy = jest.spyOn(crypto, "randomInt");

      await service.recoverAccount("test@example.com");

      expect(randomIntSpy).toHaveBeenCalled();
      expect(mockNotificationService.sendEmail).toHaveBeenCalled();
    });

    it("should return consistent message whether user exists or not", async () => {
      mockUsersService.findByEmail.mockResolvedValueOnce(null);
      const res1 = await service.recoverAccount("nonexistent@example.com");
      expect(res1.message).toBe("If account exists, recovery code sent.");

      mockUsersService.findByEmail.mockResolvedValueOnce({
        email: "exist@example.com",
      });
      const res2 = await service.recoverAccount("exist@example.com");
      expect(res2.message).toBe("If account exists, recovery code sent.");
    });
  });
});
