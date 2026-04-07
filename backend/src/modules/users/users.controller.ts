import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { User } from './user.entity';
import { imageUploadOptions } from '../../common/utils/file-upload.util';

@ApiTags('users')
@Controller('users')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('access-token')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Current user profile' })
  getMe(@GetUser() user: User) {
    return user;
  }

  @Patch('me')
  @UseInterceptors(FileInterceptor('avatar', imageUploadOptions('avatars')))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update profile — name, avatar, visibility setting' })
  @ApiResponse({ status: 200, description: 'Updated profile' })
  updateMe(
    @Body() dto: UpdateProfileDto,
    @GetUser() user: User,
    @UploadedFile() avatar?: Express.Multer.File,
  ) {
    const avatarPath = avatar ? `/uploads/avatars/${avatar.filename}` : undefined;
    return this.usersService.updateProfile(user.id, dto, avatarPath);
  }

  @Delete('me/avatar')
  @ApiOperation({ summary: 'Remove profile avatar' })
  @ApiResponse({ status: 200, description: 'Avatar removed' })
  removeAvatar(@GetUser() user: User) {
    return this.usersService.removeAvatar(user.id);
  }

  @Get('me/events')
  @ApiOperation({ summary: 'Get events the current user is attending' })
  @ApiResponse({ status: 200, description: 'List of attended events' })
  getMyEvents(@GetUser() user: User) {
    return this.usersService.getMyEvents(user.id);
  }

  @Get('me/tickets')
  @ApiOperation({ summary: 'Get all tickets for the current user' })
  @ApiResponse({ status: 200, description: 'List of tickets' })
  getMyTickets(@GetUser() user: User) {
    return this.usersService.getMyTickets(user.id);
  }

  @Get('me/subscriptions')
  @ApiOperation({ summary: 'Get event subscriptions for the current user' })
  @ApiResponse({ status: 200, description: 'List of event subscriptions' })
  getMySubscriptions(@GetUser() user: User) {
    return this.usersService.getMySubscriptions(user.id);
  }
}
