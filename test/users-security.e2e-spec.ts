import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "./../src/app.module";
import { SystemService } from "./../src/system/system.service";
import { PrismaService } from "./../src/prisma/prisma.service";

describe("UsersController Security (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.JWT_SECRET = "test-secret";

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SystemService)
      .useValue({
        onModuleInit: jest.fn(),
      })
      .overrideProvider(PrismaService)
      .useValue({
        onModuleInit: jest.fn(),
        user: {
          findMany: jest.fn(),
          count: jest.fn(),
          findUnique: jest.fn(),
          create: jest.fn(),
          update: jest.fn(),
          delete: jest.fn(),
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    app.useLogger({
      log: () => {},
      error: () => {},
      warn: () => {},
      debug: () => {},
      verbose: () => {},
      fatal: () => {},
    });

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  /* eslint-disable @typescript-eslint/no-unsafe-argument */
  it("/users (GET) should require authentication", () => {
    return request(app.getHttpServer()).get("/users").expect(401);
  });

  it("/users/1 (GET) should require authentication", () => {
    return request(app.getHttpServer()).get("/users/1").expect(401);
  });

  it("/users (POST) should require authentication", () => {
    return request(app.getHttpServer())
      .post("/users")
      .send({ email: "test@example.com", password: "password" })
      .expect(401);
  });

  it("/users/1 (PATCH) should require authentication", () => {
    return request(app.getHttpServer())
      .patch("/users/1")
      .send({ firstName: "Hacked" })
      .expect(401);
  });

  it("/users/1 (DELETE) should require authentication", () => {
    return request(app.getHttpServer()).delete("/users/1").expect(401);
  });
});
