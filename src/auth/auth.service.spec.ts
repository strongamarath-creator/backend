import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { UsersService } from "../users/users.service";
import { JwtService } from "@nestjs/jwt";
import { NotificationService } from "../notifications/notification.service";
import { User } from "@prisma/client";

describe("AuthService", () => {
  let service: AuthService;

  const mockUsersService = {
    findByEmail: jest.fn(),
    findByPhone: jest.fn(),
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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("recoverAccount", () => {
    it("should generate a recovery code and send email if user found by email", async () => {
      const email = "test@example.com";
      const user = { email, id: 1 } as User;
      mockUsersService.findByEmail.mockResolvedValue(user);

      await service.recoverAccount(email);

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(email);
      expect(mockNotificationService.sendEmail).toHaveBeenCalledWith(
        email,
        "Recovery Code",
        expect.stringMatching(/Your code: \d{6}/),
      );
    });

    it("should generate a recovery code and send sms if user found by phone", async () => {
      const phone = "1234567890";
      const user = { phoneNumber: phone, id: 1 } as User;
      mockUsersService.findByPhone.mockResolvedValue(user);

      await service.recoverAccount(phone);

      expect(mockUsersService.findByPhone).toHaveBeenCalledWith(phone);
      expect(mockNotificationService.sendSms).toHaveBeenCalledWith(
        phone,
        expect.stringMatching(/Your code: \d{6}/),
      );
    });

    it("should return message if user not found", async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      const email = "notfound@example.com";

      const result = await service.recoverAccount(email);

      expect(result).toEqual({
        message: "If account exists, recovery code sent.",
      });
      expect(mockNotificationService.sendEmail).not.toHaveBeenCalled();
    });
  });
});
