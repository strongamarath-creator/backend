import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { UsersService } from "../users/users.service";
import { JwtService } from "@nestjs/jwt";
import { NotificationService } from "../notifications/notification.service";
import { UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcryptjs";

describe("AuthService Security", () => {
  let service: AuthService;
  let usersService: Partial<UsersService>;
  let jwtService: Partial<JwtService>;
  let notificationService: Partial<NotificationService>;

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      findByPhone: jest.fn(),
      findByIdWithPassword: jest.fn(),
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

  describe("login", () => {
    it('should throw "Invalid credentials" when user is not found (generic error)', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(null);

      try {
        await service.login({ email: "unknown@example.com", password: "pass" });

        fail("Should have thrown UnauthorizedException");
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);

        expect((error as UnauthorizedException).message).toBe(
          "Invalid credentials",
        );
      }
    });

    it('should throw "Invalid credentials" when password is invalid (generic error)', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue({
        email: "test@example.com",
        password: "hashedpassword",
      });
      // mock bcrypt compare to false
      // @ts-expect-error - mockResolvedValue is not available on all jest mocks depending on setup, but this is a standard way to mock async functions
      jest.spyOn(bcrypt, "compare").mockResolvedValue(false);

      try {
        await service.login({
          email: "test@example.com",
          password: "wrongpass",
        });

        fail("Should have thrown UnauthorizedException");
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);

        expect((error as UnauthorizedException).message).toBe(
          "Invalid credentials",
        );
      }
    });
  });

  describe("recoverAccount", () => {
    it("should return generic message when user exists", async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue({
        email: "test@example.com",
        password: "hashedpassword",
      });

      const result = await service.recoverAccount("test@example.com");
      expect(result.message).toBe("If account exists, recovery code sent.");
    });

    it("should return generic message when user does NOT exist", async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(null);

      const result = await service.recoverAccount("unknown@example.com");
      expect(result.message).toBe("If account exists, recovery code sent.");
    });
  });
});
