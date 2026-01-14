import { Test, TestingModule } from "@nestjs/testing";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AdminGuard } from "../auth/guards/admin.guard";
import { Reflector } from "@nestjs/core";
import { ForbiddenException } from "@nestjs/common";
import { RequestWithUser } from "../common/types";

describe("UsersController Security", () => {
  let controller: UsersController;
  let reflector: Reflector;
  let usersService: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            update: jest.fn(),
            remove: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            findAll: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    reflector = module.get<Reflector>(Reflector);
    usersService = module.get<UsersService>(UsersService);
  });

  describe("Guards", () => {
    it("should be protected with JwtAuthGuard", () => {
      const guards = reflector.get("__guards__", UsersController);
      expect(guards).toBeDefined();
      expect(guards).toContain(JwtAuthGuard);
    });

    it("findAll should be protected with AdminGuard", () => {
      const guards = reflector.get("__guards__", controller.findAll);
      expect(guards).toBeDefined();
      expect(guards).toContain(AdminGuard);
    });

    it("create should be protected with AdminGuard", () => {
      const guards = reflector.get("__guards__", controller.create);
      expect(guards).toBeDefined();
      expect(guards).toContain(AdminGuard);
    });
  });

  describe("Authorization Logic", () => {
    const mockUserReq = (userId: number, role: string = "USER") =>
      ({
        user: { userId, role, email: "test@test.com" },
      }) as RequestWithUser;

    it("update should throw ForbiddenException if user is not owner and not admin", () => {
      expect(() => controller.update(2, {}, mockUserReq(1))).toThrow(
        ForbiddenException,
      );
    });

    it("update should allow if user is owner", () => {
      controller.update(1, {}, mockUserReq(1));
      expect(usersService.update).toHaveBeenCalledWith(1, {});
    });

    it("update should allow if user is admin", () => {
      controller.update(2, {}, mockUserReq(1, "ADMIN"));
      expect(usersService.update).toHaveBeenCalledWith(2, {});
    });

    it("remove should throw ForbiddenException if user is not owner and not admin", () => {
      expect(() => controller.remove(2, mockUserReq(1))).toThrow(
        ForbiddenException,
      );
    });

    it("remove should allow if user is owner", () => {
      controller.remove(1, mockUserReq(1));
      expect(usersService.remove).toHaveBeenCalledWith(1);
    });

    it("remove should allow if user is admin", () => {
      controller.remove(2, mockUserReq(1, "ADMIN"));
      expect(usersService.remove).toHaveBeenCalledWith(2);
    });

    it("findOne should throw ForbiddenException if user is not owner and not admin", () => {
      expect(() => controller.findOne(2, mockUserReq(1))).toThrow(
        ForbiddenException,
      );
    });

    it("findOne should allow if user is owner", () => {
      controller.findOne(1, mockUserReq(1));
      expect(usersService.findOne).toHaveBeenCalledWith(1);
    });

    it("findOne should allow if user is admin", () => {
      controller.findOne(2, mockUserReq(1, "ADMIN"));
      expect(usersService.findOne).toHaveBeenCalledWith(2);
    });
  });
});
