/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from "@nestjs/testing";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { ForbiddenException } from "@nestjs/common";
import { RequestWithUser } from "../common/types";

describe("UsersController Security", () => {
  let controller: UsersController;
  let usersService: UsersService;

  const mockUsersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("Authorization Checks", () => {
    const userId = 1;
    const otherUserId = 2;

    const userReq = {
      user: { userId, role: "USER", email: "test@example.com" },
    } as unknown as RequestWithUser;

    const adminReq = {
      user: { userId: 99, role: "ADMIN", email: "admin@example.com" },
    } as unknown as RequestWithUser;

    const otherUserReq = {
      user: { userId: otherUserId, role: "USER", email: "other@example.com" },
    } as unknown as RequestWithUser;

    describe("findOne", () => {
      it("should allow user to access their own profile", async () => {
        await controller.findOne(userId, userReq);
        expect(usersService.findOne).toHaveBeenCalledWith(userId);
      });

      it("should allow admin to access any profile", async () => {
        await controller.findOne(userId, adminReq);
        expect(usersService.findOne).toHaveBeenCalledWith(userId);
      });

      it("should deny user accessing another profile", () => {
        expect(() => controller.findOne(userId, otherUserReq)).toThrow(
          ForbiddenException,
        );
      });
    });

    describe("update", () => {
      it("should allow user to update their own profile", async () => {
        const dto = { firstName: "Updated" };
        await controller.update(userId, dto, userReq);
        expect(usersService.update).toHaveBeenCalledWith(userId, dto);
      });

      it("should deny user updating another profile", () => {
        const dto = { firstName: "Hacked" };
        expect(() => controller.update(userId, dto, otherUserReq)).toThrow(
          ForbiddenException,
        );
      });
    });

    describe("remove", () => {
      it("should allow user to delete their own profile", async () => {
        await controller.remove(userId, userReq);
        expect(usersService.remove).toHaveBeenCalledWith(userId);
      });

      it("should allow admin to delete any profile", async () => {
        await controller.remove(userId, adminReq);
        expect(usersService.remove).toHaveBeenCalledWith(userId);
      });

      it("should deny user deleting another profile", () => {
        expect(() => controller.remove(userId, otherUserReq)).toThrow(
          ForbiddenException,
        );
      });
    });
  });
});
