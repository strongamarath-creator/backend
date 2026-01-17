/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";

describe("UsersController Security (e2e)", () => {
  let app: INestApplication;
  let jwtService: JwtService;

  const mockPrismaService = {
    user: {
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      findUnique: jest
        .fn()
        .mockResolvedValue({ id: 1, email: "test@test.com" }), // Mock for findOne
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
    },
    systemConfig: {
      findUnique: jest
        .fn()
        .mockResolvedValue({ key: "maintenance_mode", value: "false" }),
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    pageConfig: {
      upsert: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    onModuleInit: jest.fn(),
    onModuleDestroy: jest.fn(),
  };

  beforeAll(async () => {
    process.env.DATABASE_URL = "postgresql://mock:mock@localhost:5432/mock";
    process.env.JWT_SECRET = "supersecret";

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix("api");
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    jwtService = app.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe("Unauthenticated Access", () => {
    it("/api/users (GET) should fail without auth", () => {
      return request(app.getHttpServer()).get("/api/users").expect(401);
    });

    it("/api/users (POST) should fail without auth", () => {
      return request(app.getHttpServer())
        .post("/api/users")
        .send({
          email: "test@example.com",
          password: "password",
          firstName: "Hack",
          lastName: "er",
          gender: "MALE",
          birthDate: "1990-01-01",
        })
        .expect(401);
    });

    it("/api/users/1 (GET) should fail without auth", () => {
      return request(app.getHttpServer()).get("/api/users/1").expect(401);
    });

    it("/api/users/1 (PATCH) should fail without auth", () => {
      return request(app.getHttpServer())
        .patch("/api/users/1")
        .send({ firstName: "Hacked" })
        .expect(401);
    });

    it("/api/users/1 (DELETE) should fail without auth", () => {
      return request(app.getHttpServer()).delete("/api/users/1").expect(401);
    });
  });

  describe("Authenticated Access (IDOR Protection)", () => {
    it("User accessing their own data should succeed", () => {
      const token = jwtService.sign({
        sub: "1",
        email: "user1@test.com",
        role: "USER",
      });
      return request(app.getHttpServer())
        .get("/api/users/1")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);
    });

    it("User accessing OTHER user data should fail (403)", () => {
      const token = jwtService.sign({
        sub: "1",
        email: "user1@test.com",
        role: "USER",
      });
      return request(app.getHttpServer())
        .get("/api/users/2") // Accessing ID 2 with ID 1 token
        .set("Authorization", `Bearer ${token}`)
        .expect(403);
    });

    it("Admin accessing ANY data should succeed", () => {
      const token = jwtService.sign({
        sub: "99",
        email: "admin@test.com",
        role: "ADMIN",
      });
      return request(app.getHttpServer())
        .get("/api/users/2")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);
    });
  });
});
