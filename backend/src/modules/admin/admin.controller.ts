import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  ParseIntPipe,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';

class ChangeRoleDto {
  @ApiProperty({ enum: UserRole })
  @IsEnum(UserRole)
  role: UserRole;
}

@ApiTags('admin')
@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth('access-token')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Totals: users, events, tickets sold, revenue' })
  getStats() {
    return this.adminService.getStats();
  }

  @Get('users')
  @ApiOperation({ summary: 'List all users with optional search' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  getUsers(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('search') search?: string,
  ) {
    return this.adminService.getUsers(+page, +limit, search);
  }

  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Change a user role (admin/user)' })
  @ApiParam({ name: 'id', type: Number })
  changeRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ChangeRoleDto,
  ) {
    return this.adminService.changeUserRole(id, dto.role);
  }

  @Get('events')
  @ApiOperation({ summary: 'List all events for moderation' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  getEvents(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('search') search?: string,
  ) {
    return this.adminService.getEvents(+page, +limit, search);
  }

  @Delete('users/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a user (admin only, cannot delete admins)' })
  @ApiParam({ name: 'id', type: Number })
  deleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteUser(id);
  }

  @Delete('events/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete any event (admin override)' })
  @ApiParam({ name: 'id', type: Number })
  deleteEvent(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteEvent(id);
  }
}
