import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { UsersService } from "../users/users.service";
import { JwtService } from "@nestjs/jwt";
import { NotificationService } from "../notifications/notification.service";
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
    };
    jwtService = {
      sign: jest.fn().mockReturnValue("token"),
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
    it('should throw generic "Invalid credentials" when user does not exist', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(null);

      await expect(
        service.login({
          email: "nonexistent@example.com",
          password: "password",
        }),
      ).rejects.toThrow("Invalid credentials");
    });

    it('should throw generic "Invalid credentials" when password is wrong', async () => {
      const mockUser = {
        email: "user@example.com",
        password: await bcrypt.hash("correct_password", 10),
      };
      (usersService.findByEmail as jest.Mock).mockResolvedValue(mockUser);

      await expect(
        service.login({
          email: "user@example.com",
          password: "wrong_password",
        }),
      ).rejects.toThrow("Invalid credentials");
    });
  });
});
