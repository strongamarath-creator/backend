import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { UsersService } from "../users/users.service";
import { JwtService } from "@nestjs/jwt";
import { NotificationService } from "../notifications/notification.service";

describe("AuthService Security", () => {
  let service: AuthService;
  let usersService: Partial<UsersService>;
  let notificationService: Partial<NotificationService>;

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      findByPhone: jest.fn(),
    };
    notificationService = {
      sendEmail: jest.fn(),
      sendSms: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: { sign: jest.fn() } },
        { provide: NotificationService, useValue: notificationService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it("should use a cryptographically secure random number generator for recovery codes", async () => {
    // Mock user found
    (usersService.findByEmail as jest.Mock).mockResolvedValue({
      id: 1,
      email: "test@example.com",
    });

    const mathRandomSpy = jest.spyOn(Math, "random");

    await service.recoverAccount("test@example.com");

    // Expect Math.random NOT to be called, because we use crypto.randomInt
    expect(mathRandomSpy).not.toHaveBeenCalled();

    // We can also check if notification was sent, implying code generation worked (it won't crash)
    expect(notificationService.sendEmail).toHaveBeenCalled();
  });
});
