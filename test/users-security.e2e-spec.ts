import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { SystemService } from './../src/system/system.service';

describe('UsersController Security (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
  };

  const mockSystemService = {
    onModuleInit: jest.fn(),
  };

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideProvider(PrismaService)
    .useValue(mockPrismaService)
    .overrideProvider(SystemService)
    .useValue(mockSystemService)
    .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    prismaService = moduleFixture.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('GET /users (findAll) should be protected', async () => {
    const response = await request(app.getHttpServer()).get('/users');
    expect(response.status).toBe(401);
  });

  it('GET /users/:id (findOne) should be protected', async () => {
    const response = await request(app.getHttpServer()).get('/users/1');
    expect(response.status).toBe(401);
  });

  it('POST /users (create) should be protected', async () => {
    const response = await request(app.getHttpServer()).post('/users').send({});
    expect(response.status).toBe(401);
  });
});
