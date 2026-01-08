import { Test, TestingModule } from "@nestjs/testing";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { UsersService } from "../users/users.service";
import { EntitlementsService } from "../entitlements/entitlements.service";
import { InternalServerErrorException } from "@nestjs/common";
import { ThrottlerModule } from "@nestjs/throttler";

describe("AuthController Security Tests", () => {
  let controller: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }])],
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
          },
        },
        {
          provide: EntitlementsService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it("should not leak database error details on login failure", async () => {
    const dbError = new Error(
      'Connection failed: invalid password for user "postgres"',
    );
    jest.spyOn(authService, "login").mockRejectedValue(dbError);

    // Mock logger to avoid cluttering test output
    // Accessing private property for mocking purposes

    const loggerSpy = jest
      .spyOn((controller as any).logger, "error")
      .mockImplementation(() => {});

    try {
      await controller.login({
        email: "test@example.com",
        password: "password",
      });
    } catch (error) {
      expect(error).toBeInstanceOf(InternalServerErrorException);
      // Security Check: The message should NOT match the internal error message
      const exception = error as InternalServerErrorException;
      expect(exception.message).not.toBe(dbError.message);
      expect(exception.message).toBe("An error occurred during login");
    }

    loggerSpy.mockRestore();
  });
});
