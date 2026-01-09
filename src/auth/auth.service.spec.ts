import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { UsersService } from "../users/users.service";
import { JwtService } from "@nestjs/jwt";
import { NotificationService } from "../notifications/notification.service";
import { UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { User } from "@prisma/client";

describe("AuthService", () => {
  let service: AuthService;
  let usersService: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            findByPhone: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
        {
          provide: NotificationService,
          useValue: {
            sendEmail: jest.fn(),
            sendSms: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("login", () => {
    it("should throw UnauthorizedException with generic message when user not found", async () => {
      jest.spyOn(usersService, "findByEmail").mockResolvedValue(null);

      await expect(
        service.login({ email: "test@example.com", password: "password" }),
      ).rejects.toThrow(new UnauthorizedException("Invalid credentials"));
    });

    it("should throw UnauthorizedException with generic message when password invalid", async () => {
      const user = {
        id: 1,
        email: "test@example.com",
        password: await bcrypt.hash("correct", 10),
        role: "USER",
      } as unknown as User;

      jest.spyOn(usersService, "findByEmail").mockResolvedValue(user);

      await expect(
        service.login({ email: "test@example.com", password: "wrong" }),
      ).rejects.toThrow(new UnauthorizedException("Invalid credentials"));
    });
  });
});
