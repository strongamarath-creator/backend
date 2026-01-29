/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { UsersModule } from "../src/users/users.module";
import { AuthModule } from "../src/auth/auth.module";
import { SystemModule } from "../src/system/system.module";
import { PrismaService } from "../src/prisma/prisma.service";
import { SystemService } from "../src/system/system.service";
import { JwtService } from "@nestjs/jwt";
import { ConfigModule } from "@nestjs/config";

describe("UsersController Security (e2e)", () => {
  let app: INestApplication;
  let jwtService: JwtService;

  const mockPrismaService = {
    user: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockImplementation((args) => {
        if (args.where.id === 1 || args.where.id === 2) {
          return {
            id: args.where.id,
            email: `user${args.where.id}@example.com`,
            role: "USER",
          };
        }
        return null;
      }),
      count: jest.fn().mockResolvedValue(0),
      create: jest
        .fn()
        .mockResolvedValue({ id: 3, email: "new@example.com", role: "USER" }),
      update: jest.fn().mockResolvedValue({
        id: 1,
        email: "updated@example.com",
        role: "USER",
      }),
      delete: jest.fn().mockResolvedValue({
        id: 1,
        email: "deleted@example.com",
        role: "USER",
      }),
    },
    systemConfig: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({}),
    },
    pageConfig: {
      upsert: jest.fn().mockResolvedValue({}),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };

  const mockSystemService = {
    onModuleInit: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        UsersModule,
        AuthModule,
        SystemModule,
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .overrideProvider(SystemService)
      .useValue(mockSystemService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

    await app.init();

    jwtService = app.get<JwtService>(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  const generateToken = (userId: number, role: string) => {
    return jwtService.sign({
      sub: userId.toString(),
      email: "test@example.com",
      role,
    });
  };

  describe("/users (GET)", () => {
    it("should reject unauthenticated request", () => {
      return request(app.getHttpServer()).get("/users").expect(401);
    });

    it("should reject non-admin user", () => {
      const token = generateToken(1, "USER");
      return request(app.getHttpServer())
        .get("/users")
        .set("Authorization", `Bearer ${token}`)
        .expect(403);
    });

    it("should allow admin user", () => {
      const token = generateToken(999, "ADMIN");
      return request(app.getHttpServer())
        .get("/users")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);
    });
  });

  describe("/users/:id (GET)", () => {
    it("should reject unauthenticated request", () => {
      return request(app.getHttpServer()).get("/users/1").expect(401);
    });

    it("should allow user to access own profile", () => {
      const token = generateToken(1, "USER");
      return request(app.getHttpServer())
        .get("/users/1")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);
    });

    it("should reject user accessing another profile", () => {
      const token = generateToken(1, "USER");
      return request(app.getHttpServer())
        .get("/users/2")
        .set("Authorization", `Bearer ${token}`)
        .expect(403);
    });

    it("should allow admin to access any profile", () => {
      const token = generateToken(999, "ADMIN");
      return request(app.getHttpServer())
        .get("/users/2")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);
    });
  });

  describe("/users (POST)", () => {
    const validUserBody = {
      email: "new@example.com",
      password: "password",
      firstName: "John",
      lastName: "Doe",
      birthDate: "1990-01-01",
      gender: "MALE",
    };

    it("should reject unauthenticated request", () => {
      return request(app.getHttpServer())
        .post("/users")
        .send(validUserBody)
        .expect(401);
    });

    it("should reject non-admin user", () => {
      const token = generateToken(1, "USER");
      return request(app.getHttpServer())
        .post("/users")
        .set("Authorization", `Bearer ${token}`)
        .send(validUserBody)
        .expect(403);
    });

    it("should allow admin user", () => {
      const token = generateToken(999, "ADMIN");
      return request(app.getHttpServer())
        .post("/users")
        .set("Authorization", `Bearer ${token}`)
        .send(validUserBody)
        .expect(201);
    });
  });

  describe("/users/:id (PATCH)", () => {
    it("should reject unauthenticated request", () => {
      return request(app.getHttpServer())
        .patch("/users/1")
        .send({ firstName: "Updated" })
        .expect(401);
    });

    it("should allow user to update own profile", () => {
      const token = generateToken(1, "USER");
      return request(app.getHttpServer())
        .patch("/users/1")
        .set("Authorization", `Bearer ${token}`)
        .send({ firstName: "Updated" })
        .expect(200);
    });

    it("should reject user updating another profile", () => {
      const token = generateToken(1, "USER");
      return request(app.getHttpServer())
        .patch("/users/2")
        .set("Authorization", `Bearer ${token}`)
        .send({ firstName: "Updated" })
        .expect(403);
    });
  });

  describe("/users/:id (DELETE)", () => {
    it("should reject unauthenticated request", () => {
      return request(app.getHttpServer()).delete("/users/1").expect(401);
    });

    it("should allow user to delete own profile", () => {
      const token = generateToken(1, "USER");
      return request(app.getHttpServer())
        .delete("/users/1")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);
    });

    it("should reject user deleting another profile", () => {
      const token = generateToken(1, "USER");
      return request(app.getHttpServer())
        .delete("/users/2")
        .set("Authorization", `Bearer ${token}`)
        .expect(403);
    });
  });
});
