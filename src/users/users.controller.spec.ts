import { Test, TestingModule } from "@nestjs/testing";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AdminGuard } from "../auth/guards/admin.guard";
import { ForbiddenException } from "@nestjs/common";

describe("UsersController", () => {
  let controller: UsersController;

  const mockUsersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockUser = {
    id: 1,
    email: "test@example.com",
    password: "hashedpassword",
    role: "USER",
    createdAt: new Date(),
    updatedAt: new Date(),
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
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AdminGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UsersController>(UsersController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("create", () => {
    it("should create a user", async () => {
      const createUserDto: CreateUserDto = {
        email: "test@example.com",
        password: "password",
        birthDate: "1990-01-01",
        gender: "MALE",
        firstName: "Test",
        lastName: "User",
      };
      mockUsersService.create.mockResolvedValue(mockUser);

      expect(await controller.create(createUserDto)).toBe(mockUser);
      expect(mockUsersService.create).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe("update", () => {
    it("should update a user if allowed", async () => {
      const updateUserDto: UpdateUserDto = { firstName: "Updated Name" };
      const req = { user: { userId: 1, role: "USER", email: "test", sub: "1" } };
      mockUsersService.update.mockResolvedValue({
        ...mockUser,
        ...updateUserDto,
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
      expect(await controller.update(req as any, 1, updateUserDto)).toEqual({
        ...mockUser,
        ...updateUserDto,
      });
      expect(mockUsersService.update).toHaveBeenCalledWith(1, updateUserDto);
    });

    it("should throw ForbiddenException if user tries to update another user", async () => {
      const updateUserDto: UpdateUserDto = { firstName: "Updated Name" };
      const req = { user: { userId: 2, role: "USER", email: "test", sub: "2" } };

      // Ensure that calling controller.update throws ForbiddenException
      await expect(async () => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
        await controller.update(req as any, 1, updateUserDto);
      }).rejects.toThrow(ForbiddenException);
    });

    it("should allow admin to update any user", async () => {
      const updateUserDto: UpdateUserDto = { firstName: "Updated Name" };
      const req = { user: { userId: 2, role: "ADMIN", email: "admin", sub: "2" } };
      mockUsersService.update.mockResolvedValue({
        ...mockUser,
        ...updateUserDto,
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
      expect(await controller.update(req as any, 1, updateUserDto)).toEqual({
        ...mockUser,
        ...updateUserDto,
      });
      expect(mockUsersService.update).toHaveBeenCalledWith(1, updateUserDto);
    });
  });
});
