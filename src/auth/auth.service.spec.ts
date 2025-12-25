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

  describe("login", () => {
    it("should throw UnauthorizedException if user not found", async () => {
        (usersService.findByEmail as jest.Mock).mockResolvedValue(null);
        await expect(service.login({ email: "test@test.com", password: "password" })).rejects.toThrow(UnauthorizedException);
    });

    it("should throw UnauthorizedException if password invalid", async () => {
         const user = { email: "test@test.com", password: "hashedPassword", role: "USER", id: 1 };
         (usersService.findByEmail as jest.Mock).mockResolvedValue(user);
         // Mock bcrypt.compare to return false
         jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));

         await expect(service.login({ email: "test@test.com", password: "wrong" })).rejects.toThrow(UnauthorizedException);
    });
  });

  describe("recoverAccount", () => {
      it("should send recovery code via email", async () => {
          const user = { email: "test@test.com", id: 1 };
          (usersService.findByEmail as jest.Mock).mockResolvedValue(user);

          await service.recoverAccount("test@test.com");

          expect(notificationService.sendEmail).toHaveBeenCalled();
          const callArgs = (notificationService.sendEmail as jest.Mock).mock.calls[0] as unknown as [string, string, string];
          expect(callArgs[0]).toBe("test@test.com");
          expect(callArgs[2]).toMatch(/Your code: \d+/);
      });
  });
});
