import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
  Res,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Response } from 'express';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  AuthResponseDto,
} from './dto/auth.dto';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { User } from '../users/user.entity';
import { GoogleProfile } from './strategies/google.strategy';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiResponse({ status: 201, description: 'Registration successful, confirmation email sent' })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Get('confirm-email')
  @ApiOperation({ summary: 'Confirm email address via token from email link' })
  @ApiQuery({ name: 'token', required: true, description: 'Email confirmation token' })
  @ApiResponse({ status: 200, description: 'Email confirmed' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  confirmEmail(@Query('token') token: string) {
    return this.authService.confirmEmail(token);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login and receive JWT tokens' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate refresh token and get new access token' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Logout and invalidate refresh token' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  logout(@GetUser() user: User) {
    return this.authService.logout(user.id);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send password reset link to email' })
  @ApiResponse({ status: 200, description: 'Reset link sent if account exists' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using token from email' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth2 login' })
  @ApiResponse({ status: 302, description: 'Redirects to Google consent screen' })
  googleAuth() {

  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth2 callback — returns tokens via redirect' })
  async googleCallback(
    @Req() req: { user: GoogleProfile },
    @Res() res: Response,
  ) {
    const tokens = await this.authService.googleLogin(req.user);
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    res.redirect(
      `${frontendUrl}/auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`,
    );
  }
}
