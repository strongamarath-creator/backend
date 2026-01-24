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

  const mockUsersService = {
    findByEmail: jest.fn(),
    findByPhone: jest.fn(),
  };
  const mockJwtService = {
    sign: jest.fn(),
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

  it('should throw "Invalid credentials" when user is not found', async () => {
    mockUsersService.findByEmail.mockResolvedValue(null);

    await expect(
      service.login({ email: 'nonexistent@example.com', password: 'password' }),
    ).rejects.toThrow(new UnauthorizedException('Invalid credentials'));
  });

  it('should throw "Invalid credentials" when password is incorrect', async () => {
    const hashedPassword = await bcrypt.hash('password', 10);
    mockUsersService.findByEmail.mockResolvedValue({
      id: 1,
      email: 'user@example.com',
      password: hashedPassword,
      role: 'USER',
    });

    await expect(
      service.login({ email: 'user@example.com', password: 'wrongpassword' }),
    ).rejects.toThrow(new UnauthorizedException('Invalid credentials'));
  });
});
