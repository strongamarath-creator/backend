import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { SystemService } from '../src/system/system.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

// Ensure JWT_SECRET is set for AuthModule
process.env.JWT_SECRET = 'test-secret';
process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';

describe('UsersController Security (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  const mockSystemService = {
    onModuleInit: jest.fn(),
    getConfig: jest.fn(),
    seedDefaultPagesIfMissing: jest.fn(),
  };

  const mockPrismaService = {
    onModuleInit: jest.fn(),
    onModuleDestroy: jest.fn(),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    user: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      findUnique: jest.fn().mockImplementation((args) => {
        if (args.where.id === 1 || args.where.id === 2) {
            return Promise.resolve({ id: args.where.id, email: 'test@example.com' });
        }
        return Promise.resolve(null);
      }),
      update: jest.fn(),
      delete: jest.fn(),
      create: jest.fn(),
    }
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideProvider(SystemService)
    .useValue(mockSystemService)
    .overrideProvider(PrismaService)
    .useValue(mockPrismaService)
    .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    jwtService = app.get<JwtService>(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Unauthenticated Access', () => {
    it('GET /users should return 401', () => {
      return request(app.getHttpServer())
        .get('/users')
        .expect(401);
    });

    it('GET /users/1 should return 401', () => {
      return request(app.getHttpServer())
        .get('/users/1')
        .expect(401);
    });

    it('PATCH /users/1 should return 401', () => {
        return request(app.getHttpServer())
          .patch('/users/1')
          .send({ firstName: 'Hacked' })
          .expect(401);
    });

    it('DELETE /users/1 should return 401', () => {
        return request(app.getHttpServer())
          .delete('/users/1')
          .expect(401);
    });
  });

  describe('Authenticated Access', () => {
    let token: string;

    beforeAll(() => {
        // sub should be a string for JwtStrategy to convert to number
        token = jwtService.sign({ sub: '1', email: 'user@example.com', role: 'USER' });
    });

    it('GET /users/1 (Own Profile) should return 200', () => {
      return request(app.getHttpServer())
        .get('/users/1')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });

    it('GET /users/2 (Other Profile) should return 403', () => {
      return request(app.getHttpServer())
        .get('/users/2')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });
});
