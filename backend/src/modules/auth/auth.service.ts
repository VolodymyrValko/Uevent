import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { User, UserRole } from '../users/user.entity';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  AuthResponseDto,
} from './dto/auth.dto';
import { MailService } from '../notifications/mail.service';
import { GoogleProfile } from './strategies/google.strategy';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async register(dto: RegisterDto): Promise<{ message: string }> {
    const existing = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = this.usersRepo.create({
      email: dto.email,
      password: hashedPassword,
      firstName: dto.firstName,
      lastName: dto.lastName,
      isEmailConfirmed: true,
      role: UserRole.USER,
    });

    await this.usersRepo.save(user);

    return { message: 'Registration successful. You can now log in.' };
  }

  async confirmEmail(token: string): Promise<{ message: string }> {
    const user = await this.usersRepo.findOne({
      where: { emailConfirmationToken: token },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired confirmation token');
    }

    user.isEmailConfirmed = true;
    user.emailConfirmationToken = null;
    await this.usersRepo.save(user);

    return { message: 'Email confirmed successfully. You can now log in.' };
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.usersRepo.findOne({ where: { email: dto.email } });

    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.generateTokens(user);
  }

  async refresh(dto: RefreshTokenDto): Promise<AuthResponseDto> {
    let payload: { sub: number };
    try {
      payload = this.jwtService.verify(dto.refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.usersRepo.findOne({ where: { id: payload.sub } });
    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Session expired, please log in again');
    }

    const isValid = await bcrypt.compare(dto.refreshToken, user.refreshToken);
    if (!isValid) {
      throw new UnauthorizedException('Refresh token reuse detected');
    }

    return this.generateTokens(user);
  }

  async logout(userId: number): Promise<{ message: string }> {
    await this.usersRepo.update(userId, { refreshToken: null });
    return { message: 'Logged out successfully' };
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.usersRepo.findOne({ where: { email: dto.email } });

    if (!user) {
      return { message: 'If an account with that email exists, a reset link has been sent.' };
    }

    const resetToken = uuidv4();
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = expires;
    await this.usersRepo.save(user);

    await this.mailService.sendPasswordReset(user.email, resetToken);

    return { message: 'If an account with that email exists, a reset link has been sent.' };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const user = await this.usersRepo.findOne({
      where: { passwordResetToken: dto.token },
    });

    if (
      !user ||
      !user.passwordResetExpires ||
      user.passwordResetExpires < new Date()
    ) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    user.password = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    user.refreshToken = null;
    await this.usersRepo.save(user);

    return { message: 'Password reset successfully. You can now log in.' };
  }

  async googleLogin(profile: GoogleProfile): Promise<AuthResponseDto> {
    let user = await this.usersRepo.findOne({
      where: [{ googleId: profile.googleId }, { email: profile.email }],
    });

    if (!user) {
      user = this.usersRepo.create({
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        avatar: profile.avatar,
        googleId: profile.googleId,
        password: await bcrypt.hash(uuidv4(), BCRYPT_ROUNDS),
        isEmailConfirmed: true,
        role: UserRole.USER,
      });
      await this.usersRepo.save(user);
    } else if (!user.googleId) {
      user.googleId = profile.googleId;
      await this.usersRepo.save(user);
    }

    return this.generateTokens(user);
  }

  private async generateTokens(user: User): Promise<AuthResponseDto> {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    });

    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
      },
    );

    const hashedRefresh = await bcrypt.hash(refreshToken, 10);
    await this.usersRepo.update(user.id, { refreshToken: hashedRefresh });

    return { accessToken, refreshToken };
  }
}
