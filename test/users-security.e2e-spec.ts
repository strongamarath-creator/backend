import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { UsersModule } from "./../src/users/users.module";
import { AuthModule } from "./../src/auth/auth.module";
import { ConfigModule } from "@nestjs/config";
import { PrismaService } from "./../src/prisma/prisma.service";
import { ThrottlerModule } from "@nestjs/throttler";
import { SystemService } from "./../src/system/system.service";

describe("UsersController Security (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [() => ({ JWT_SECRET: "test-secret" })],
        }),
        ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
        UsersModule,
        AuthModule,
      ],
    })
      .overrideProvider(PrismaService)
      .useValue({
        onModuleInit: jest.fn(),
        user: {
          findMany: jest.fn().mockResolvedValue([]),
          count: jest.fn().mockResolvedValue(0),
        },
        // In case SystemService isn't mocked correctly and tries to use prisma
        systemConfig: {
          findUnique: jest.fn().mockResolvedValue(null),
        },
      })
      .overrideProvider(SystemService)
      .useValue({
        onModuleInit: jest.fn(),
        getConfig: jest.fn(),
      })
      .setLogger({
        log: () => {},
        error: () => {},
        warn: () => {},
        debug: () => {},
        verbose: () => {},
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("/users (GET) should require authentication", () => {
    /* eslint-disable @typescript-eslint/no-unsafe-argument */
    return request(app.getHttpServer()).get("/users").expect(401);
    /* eslint-enable @typescript-eslint/no-unsafe-argument */
  });
});
