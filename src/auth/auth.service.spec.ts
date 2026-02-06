import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { NotificationService } from '../notifications/notification.service';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

describe('AuthService Security', () => {
  let service: AuthService;
  let usersService: UsersService;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    password: 'hashedPassword',
    role: 'USER',
  };

  const mockUsersService = {
    findByEmail: jest.fn(),
    findByPhone: jest.fn(),
    findByIdWithPassword: jest.fn(),
    updatePassword: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(() => 'token'),
  };

  const mockNotificationService = {
    sendEmail: jest.fn(),
    sendSms: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should throw UnauthorizedException with "Invalid credentials" when user is not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'wrong@example.com', password: 'password' }),
      ).rejects.toThrow(new UnauthorizedException('Invalid credentials'));
    });

    it('should throw UnauthorizedException with "Invalid credentials" when password is invalid', async () => {
      // Create a real hash for the mock user to verify bcrypt.compare fails correctly
      const realHash = await bcrypt.hash('correctPassword', 10);
      mockUsersService.findByEmail.mockResolvedValue({ ...mockUser, password: realHash });

      await expect(
        service.login({ email: 'test@example.com', password: 'wrongPassword' }),
      ).rejects.toThrow(new UnauthorizedException('Invalid credentials'));
    });
  });
});
