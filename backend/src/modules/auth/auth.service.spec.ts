import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User, UserRole } from '../users/user.entity';
import { MailService } from '../notifications/mail.service';

const mockUserRepo = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
});

const mockJwtService = () => ({
  sign: jest.fn().mockReturnValue('mock.jwt.token'),
  verify: jest.fn().mockReturnValue({ sub: 1 }),
});

const mockMailService = () => ({
  sendEmailConfirmation: jest.fn().mockResolvedValue(undefined),
  sendPasswordReset: jest.fn().mockResolvedValue(undefined),
});

const makeUser = (overrides: Partial<User> = {}): User => ({
  id: 1,
  email: 'test@example.com',
  password: '$2b$12$hashedpassword',
  firstName: 'John',
  lastName: 'Doe',
  avatar: null,
  role: UserRole.USER,
  showNameInEvents: true,
  isEmailConfirmed: true,
  emailConfirmationToken: null,
  refreshToken: null,
  passwordResetToken: null,
  passwordResetExpires: null,
  googleId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  company: null,
  tickets: [],
  comments: [],
  notifications: [],
  eventSubscriptions: [],
  companySubscriptions: [],
  ...overrides,
});

describe('AuthService', () => {
  let service: AuthService;
  let usersRepo: jest.Mocked<Repository<User>>;
  let jwtService: jest.Mocked<JwtService>;
  let mailService: jest.Mocked<MailService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useFactory: mockUserRepo },
        { provide: JwtService, useFactory: mockJwtService },
        { provide: MailService, useFactory: mockMailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersRepo = module.get(getRepositoryToken(User));
    jwtService = module.get(JwtService);
    mailService = module.get(MailService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('register', () => {
    const dto = {
      email: 'new@example.com',
      password: 'SecurePass123',
      firstName: 'Jane',
      lastName: 'Smith',
    };

    it('creates user and sends confirmation email', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      const created = makeUser({ email: dto.email, isEmailConfirmed: false });
      usersRepo.create.mockReturnValue(created);
      usersRepo.save.mockResolvedValue(created);

      const result = await service.register(dto);

      expect(usersRepo.findOne).toHaveBeenCalledWith({ where: { email: dto.email } });
      expect(usersRepo.save).toHaveBeenCalled();
      expect(mailService.sendEmailConfirmation).toHaveBeenCalled();
      expect(result.message).toContain('Registration successful');
    });

    it('throws ConflictException when email already exists', async () => {
      usersRepo.findOne.mockResolvedValue(makeUser());

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
      expect(usersRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('returns tokens for valid confirmed credentials', async () => {
      const hashedPw = await bcrypt.hash('correctpassword', 10);
      const user = makeUser({ password: hashedPw, isEmailConfirmed: true });
      usersRepo.findOne.mockResolvedValue(user);
      usersRepo.update.mockResolvedValue({ affected: 1 } as any);

      const result = await service.login({
        email: 'test@example.com',
        password: 'correctpassword',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
    });

    it('throws UnauthorizedException for wrong password', async () => {
      const hashedPw = await bcrypt.hash('correctpassword', 10);
      usersRepo.findOne.mockResolvedValue(makeUser({ password: hashedPw }));

      await expect(
        service.login({ email: 'test@example.com', password: 'wrongpassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when email not confirmed', async () => {
      const hashedPw = await bcrypt.hash('correctpassword', 10);
      usersRepo.findOne.mockResolvedValue(
        makeUser({ password: hashedPw, isEmailConfirmed: false }),
      );

      await expect(
        service.login({ email: 'test@example.com', password: 'correctpassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when user not found', async () => {
      usersRepo.findOne.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nobody@example.com', password: 'anything' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('clears refresh token', async () => {
      usersRepo.update.mockResolvedValue({ affected: 1 } as any);

      const result = await service.logout(1);

      expect(usersRepo.update).toHaveBeenCalledWith(1, { refreshToken: null });
      expect(result.message).toContain('Logged out');
    });
  });

  describe('forgotPassword', () => {
    it('returns success message even when user not found (prevents enumeration)', async () => {
      usersRepo.findOne.mockResolvedValue(null);

      const result = await service.forgotPassword({ email: 'nobody@example.com' });

      expect(result.message).toContain('If an account');
      expect(mailService.sendPasswordReset).not.toHaveBeenCalled();
    });

    it('sends reset email when user found', async () => {
      const user = makeUser();
      usersRepo.findOne.mockResolvedValue(user);
      usersRepo.save.mockResolvedValue(user);

      const result = await service.forgotPassword({ email: user.email });

      expect(mailService.sendPasswordReset).toHaveBeenCalledWith(
        user.email,
        expect.any(String),
      );
      expect(result.message).toContain('If an account');
    });
  });
});
