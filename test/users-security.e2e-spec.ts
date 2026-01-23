/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, ExecutionContext } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { SystemService } from './../src/system/system.service';
import { JwtAuthGuard } from './../src/auth/jwt-auth.guard';

describe('UsersController Security (e2e)', () => {
  const mockPrismaService = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    user: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn().mockResolvedValue({ id: 1, email: 'test@example.com' }),
      update: jest.fn().mockResolvedValue({ id: 1, email: 'test@example.com' }),
      delete: jest.fn().mockResolvedValue({ id: 1 }),
    },
    systemConfig: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
    },
  };

  const mockSystemService = {
    onModuleInit: jest.fn(),
  };

  describe('Unauthenticated Access', () => {
    let app: INestApplication;

    beforeAll(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      })
      .overrideProvider(PrismaService).useValue(mockPrismaService)
      .overrideProvider(SystemService).useValue(mockSystemService)
      .compile();

      app = moduleFixture.createNestApplication();
      app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
      await app.init();
    });

    afterAll(async () => {
      await app.close();
    });

    it('GET /users should return 401', () => {
      return request(app.getHttpServer()).get('/users').expect(401);
    });

    it('POST /users should return 401', () => {
      return request(app.getHttpServer()).post('/users').send({}).expect(401);
    });

    it('GET /users/1 should return 401', () => {
      return request(app.getHttpServer()).get('/users/1').expect(401);
    });

    it('PATCH /users/1 should return 401', () => {
      return request(app.getHttpServer()).patch('/users/1').send({}).expect(401);
    });

    it('DELETE /users/1 should return 401', () => {
      return request(app.getHttpServer()).delete('/users/1').expect(401);
    });
  });

  describe('Authenticated Access (As User 1)', () => {
    let app: INestApplication;

    beforeAll(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      })
      .overrideProvider(PrismaService).useValue(mockPrismaService)
      .overrideProvider(SystemService).useValue(mockSystemService)
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          req.user = { userId: 1, role: 'USER', email: 'user@example.com' };
          return true;
        },
      })
      .compile();

      app = moduleFixture.createNestApplication();
      app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
      await app.init();
    });

    afterAll(async () => {
      await app.close();
    });

    it('GET /users/1 should return 200 (Owner)', () => {
      return request(app.getHttpServer()).get('/users/1').expect(200);
    });

    it('PATCH /users/1 should return 200 (Owner)', () => {
      // We send valid data or empty data (ValidationPipe whitelist: true strips unknown,
      // but if DTO has constraints it might fail 400.
      // If we get 400, it means we passed Auth/Ownership.
      // If we get 403, we failed Ownership.
      // If we get 200, we passed both (if service mock returns success).
      return request(app.getHttpServer()).patch('/users/1').send({ firstName: 'Test' }).expect(200);
    });

    it('GET /users/2 should return 403 (Not Owner)', () => {
      return request(app.getHttpServer()).get('/users/2').expect(403);
    });

    it('PATCH /users/2 should return 403 (Not Owner)', () => {
      return request(app.getHttpServer()).patch('/users/2').send({}).expect(403);
    });

    it('DELETE /users/2 should return 403 (Not Owner)', () => {
      return request(app.getHttpServer()).delete('/users/2').expect(403);
    });
  });
});
