import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "./../src/app.module";
import { SystemService } from "./../src/system/system.service";
import { PrismaService } from "./../src/prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";

describe("UsersController Security (e2e)", () => {
  let app: INestApplication;
  let jwtService: JwtService;

  const dummyLogger = {
    log: () => {},
    error: () => {},
    warn: () => {},
    debug: () => {},
    verbose: () => {},
    setContext: () => {},
  };

  const mockSystemService = {
    onModuleInit: jest.fn().mockResolvedValue(undefined),
  };

  const mockPrismaService = {
    user: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest
        .fn()
        .mockResolvedValue({ id: 1, email: "test@example.com" }), // return something so 404 doesn't happen before guard check? No, guard is first.
      update: jest.fn().mockResolvedValue({ id: 1 }),
      delete: jest.fn().mockResolvedValue({ id: 1 }),
    },
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
  };

  beforeAll(async () => {
    // Ensure JWT_SECRET is set for ConfigService validation
    if (!process.env.JWT_SECRET) {
      process.env.JWT_SECRET = "test-secret";
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SystemService)
      .useValue(mockSystemService)
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .setLogger(dummyLogger)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix("api");
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    jwtService = app.get<JwtService>(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe("Unauthenticated Access", () => {
    it("/api/users (GET) - should return 401", () => {
      /* eslint-disable @typescript-eslint/no-unsafe-argument */
      return request(app.getHttpServer()).get("/api/users").expect(401);
      /* eslint-enable @typescript-eslint/no-unsafe-argument */
    });

    it("/api/users/1 (GET) - should return 401", () => {
      /* eslint-disable @typescript-eslint/no-unsafe-argument */
      return request(app.getHttpServer()).get("/api/users/1").expect(401);
      /* eslint-enable @typescript-eslint/no-unsafe-argument */
    });

    it("/api/users/1 (PATCH) - should return 401", () => {
      /* eslint-disable @typescript-eslint/no-unsafe-argument */
      return request(app.getHttpServer())
        .patch("/api/users/1")
        .send({ firstName: "Hacked" })
        .expect(401);
      /* eslint-enable @typescript-eslint/no-unsafe-argument */
    });
  });

  describe("Authenticated Access Control", () => {
    let user1Token: string;
    let user2Token: string;

    beforeAll(() => {
      // sub must be a string of a number as per JwtStrategy
      user1Token = jwtService.sign({
        sub: "1",
        email: "user1@example.com",
        role: "USER",
      });
      user2Token = jwtService.sign({
        sub: "2",
        email: "user2@example.com",
        role: "USER",
      });
    });

    it("/api/users (GET) - should return 403 for non-admin", () => {
      /* eslint-disable @typescript-eslint/no-unsafe-argument */
      return request(app.getHttpServer())
        .get("/api/users")
        .set("Authorization", `Bearer ${user1Token}`)
        .expect(403);
      /* eslint-enable @typescript-eslint/no-unsafe-argument */
    });

    it("/api/users/1 (PATCH) - User 2 cannot update User 1", () => {
      /* eslint-disable @typescript-eslint/no-unsafe-argument */
      return request(app.getHttpServer())
        .patch("/api/users/1")
        .set("Authorization", `Bearer ${user2Token}`)
        .send({ firstName: "Hacked" })
        .expect(403);
      /* eslint-enable @typescript-eslint/no-unsafe-argument */
    });

    it("/api/users/1 (GET) - User 2 cannot view User 1 full profile", () => {
      /* eslint-disable @typescript-eslint/no-unsafe-argument */
      return request(app.getHttpServer())
        .get("/api/users/1")
        .set("Authorization", `Bearer ${user2Token}`)
        .expect(403);
      /* eslint-enable @typescript-eslint/no-unsafe-argument */
    });
  });
});
