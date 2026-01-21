import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { UsersService } from "../users/users.service";
import { JwtService } from "@nestjs/jwt";
import { NotificationService } from "../notifications/notification.service";
import * as bcrypt from "bcryptjs";

describe("AuthService Security", () => {
  let service: AuthService;
  let usersService: Partial<UsersService>;

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      findByPhone: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: { sign: jest.fn() } },
        {
          provide: NotificationService,
          useValue: { sendEmail: jest.fn(), sendSms: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it("should NOT expose user existence via error message", async () => {
    // 1. User not found
    (usersService.findByEmail as jest.Mock).mockResolvedValue(null);
    await expect(
      service.login({ email: "unknown@example.com", password: "password" }),
    ).rejects.toThrow("Invalid credentials");

    // 2. User found, wrong password
    const hashedPassword = await bcrypt.hash("correct_password", 10);
    (usersService.findByEmail as jest.Mock).mockResolvedValue({
      id: 1,
      email: "exists@example.com",
      password: hashedPassword,
      role: "USER",
    } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

    await expect(
      service.login({
        email: "exists@example.com",
        password: "wrong_password",
      }),
    ).rejects.toThrow("Invalid credentials");
  });

  it("should NOT expose user existence via recovery message", async () => {
    const EXPECTED_MSG = "If account exists, recovery code sent.";

    // 1. User not found
    (usersService.findByEmail as jest.Mock).mockResolvedValue(null);
    const res1 = await service.recoverAccount("unknown@example.com");
    expect(res1.message).toBe(EXPECTED_MSG);

    // 2. User found
    (usersService.findByEmail as jest.Mock).mockResolvedValue({
      email: "exists@example.com",
      phoneNumber: null,
    } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    const res2 = await service.recoverAccount("exists@example.com");
    expect(res2.message).toBe(EXPECTED_MSG);
  });
});
