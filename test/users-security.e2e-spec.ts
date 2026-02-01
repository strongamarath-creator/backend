import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { SystemService } from './../src/system/system.service';
import { PrismaService } from './../src/prisma/prisma.service';

describe('UsersController Security (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';
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
      onModuleDestroy: jest.fn(),
      $connect: jest.fn(),
      $disconnect: jest.fn(),
    })
    .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Unauthenticated Access', () => {
    /* eslint-disable @typescript-eslint/no-unsafe-argument */
    it('/users (GET) should require authentication', () => {
      return request(app.getHttpServer())
        .get('/users')
        .expect(401);
    });

    it('/users (POST) should require authentication', () => {
      return request(app.getHttpServer())
        .post('/users')
        .send({ email: 'test@example.com', password: 'password' })
        .expect(401);
    });

    it('/users/:id (GET) should require authentication', () => {
      return request(app.getHttpServer())
        .get('/users/1')
        .expect(401);
    });

    it('/users/:id (PATCH) should require authentication', () => {
      return request(app.getHttpServer())
        .patch('/users/1')
        .send({ firstName: 'Hacker' })
        .expect(401);
    });

    it('/users/:id (DELETE) should require authentication', () => {
      return request(app.getHttpServer())
        .delete('/users/1')
        .expect(401);
    });
    /* eslint-enable @typescript-eslint/no-unsafe-argument */
  });
});
