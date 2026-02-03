import { Test, TestingModule } from "@nestjs/testing";
import { UsersService } from "./users.service";
import { PrismaService } from "../prisma/prisma.service";
import { User, Prisma } from "@prisma/client";

// Define the shape of the mock service with explicit Jest mock types
interface MockPrismaClient {
  user: {
    create: jest.Mock<Promise<User>, [Prisma.UserCreateArgs]>;
  };
}

const mockPrismaService: MockPrismaClient = {
  user: {
    create: jest.fn<Promise<User>, [Prisma.UserCreateArgs]>(),
  },
};

describe("UsersService", () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should hash password on create", async () => {
    const createUserDto = {
      email: "test@example.com",
      password: "plainpassword",
      firstName: "Test",
      lastName: "User",
      birthDate: "1990-01-01",
      gender: "male",
    };

    mockPrismaService.user.create.mockResolvedValue({
      id: 1,
      ...createUserDto,
      phoneNumber: null,
      nationality: null,
      birthDate: new Date(createUserDto.birthDate),
      password: "hashedpassword",
      createdAt: new Date(),
      updatedAt: new Date(),
      role: "USER",
      latitude: null,
      longitude: null,
      lastLoginAt: null,
      bio: null,
      photos: [],
      interests: [],
      height: null,
      education: null,
      jobTitle: null,
      company: null,
      smoking: null,
      drinking: null,
      zodiac: null,
      lookingFor: null,
      genderPreference: null,
    } as unknown as User);

    await service.create(createUserDto);

    const expectedDataMatcher = expect.objectContaining({
      email: "test@example.com",
    }) as unknown;

    const expectedArgMatcher = expect.objectContaining({
      data: expectedDataMatcher,
    }) as unknown;

    expect(mockPrismaService.user.create).toHaveBeenCalledWith(
      expectedArgMatcher,
    );

    const createCallArgs = mockPrismaService.user.create.mock.calls[0][0];

    const data = createCallArgs.data;
    if (data && "password" in data) {
      expect(data.password).not.toBe("plainpassword");
    } else {
      throw new Error("Data or password missing in call args");
    }
  });
});
