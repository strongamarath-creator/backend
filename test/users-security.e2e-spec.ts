import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "./../src/app.module";
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { JwtService } from "@nestjs/jwt";
import { SystemService } from "./../src/system/system.service";
import { UsersService } from "./../src/users/users.service";
import { PrismaService } from "./../src/prisma/prisma.service";

describe("UsersController Security (e2e)", () => {
  let app: INestApplication;
  let jwtService: JwtService;

  beforeAll(async () => {
    process.env.JWT_SECRET = "test-secret";
    // Must set dummy DATABASE_URL to avoid PrismaService constructor error before we override it?
    // Actually, Test.createTestingModule doesn't instantiate providers until .compile() or .createNestApplication()
    // But overrideProvider replaces it, so the original constructor shouldn't run if we useValue.
    // HOWEVER, if other modules import PrismaModule, they use the exported provider.
    // NestJS testing module override should handle this.

    // Wait, PrismaService constructor logic runs on instantiation.
    // If we override with useValue, the original class is not instantiated.

    const mockSystemService = {
      onModuleInit: jest.fn(),
    };

    const mockUsersService = {
      findAll: jest.fn().mockResolvedValue({ data: [], total: 0 }),
      findOne: jest
        .fn()
        .mockResolvedValue({ id: 999, email: "test@example.com" }),
      create: jest.fn().mockResolvedValue({ id: 1 }),
      update: jest.fn().mockResolvedValue({ id: 1 }),
      remove: jest.fn().mockResolvedValue({ id: 1 }),
      findByEmail: jest.fn(),
      findByPhone: jest.fn(),
    };

    const mockPrismaService = {
      $connect: jest.fn(),
      $disconnect: jest.fn(),
      onModuleInit: jest.fn(),
      onModuleDestroy: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SystemService)
      .useValue(mockSystemService)
      .overrideProvider(UsersService)
      .useValue(mockUsersService)
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

    await app.init();

    jwtService = app.get<JwtService>(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  const generateToken = (userId: number, email: string, role: string) => {
    return jwtService.sign({ sub: userId.toString(), email, role });
  };

  describe("Unauthenticated Access", () => {
    it("should deny GET /users (401)", () => {
      return request(app.getHttpServer()).get("/users").expect(401);
    });

    it("should deny DELETE /users/:id (401)", () => {
      return request(app.getHttpServer()).delete("/users/999").expect(401);
    });

    it("should deny PATCH /users/:id (401)", () => {
      return request(app.getHttpServer())
        .patch("/users/999")
        .send({ firstName: "Hacked" })
        .expect(401);
    });
  });

  describe("Authorization Checks", () => {
    it("should deny User A from deleting User B (403)", () => {
      const userAToken = generateToken(1, "userA@test.com", "USER");
      return request(app.getHttpServer())
        .delete("/users/2")
        .set("Authorization", `Bearer ${userAToken}`)
        .expect(403);
    });

    it("should deny User A from updating User B (403)", () => {
      const userAToken = generateToken(1, "userA@test.com", "USER");
      return request(app.getHttpServer())
        .patch("/users/2")
        .set("Authorization", `Bearer ${userAToken}`)
        .send({ firstName: "Hacked" })
        .expect(403);
    });

    it("should deny User A from viewing User B full profile (403)", () => {
      const userAToken = generateToken(1, "userA@test.com", "USER");
      return request(app.getHttpServer())
        .get("/users/2")
        .set("Authorization", `Bearer ${userAToken}`)
        .expect(403);
    });

    it("should allow Admin to GET /users (200)", () => {
      const adminToken = generateToken(999, "admin@test.com", "ADMIN");
      return request(app.getHttpServer())
        .get("/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);
    });
  });
});
