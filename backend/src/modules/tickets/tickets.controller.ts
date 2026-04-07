import {
  Controller,
  Get,
  Post,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { User } from '../users/user.entity';

@ApiTags('tickets')
@Controller('tickets')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('access-token')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get('my')
  @ApiOperation({ summary: "Get current user's tickets with event info" })
  @ApiResponse({ status: 200, description: 'List of tickets' })
  findMine(@GetUser() user: User) {
    return this.ticketsService.findMyTickets(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ticket details with QR code data URL' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Ticket with QR code' })
  @ApiResponse({ status: 403, description: 'Not your ticket' })
  findOne(@Param('id', ParseIntPipe) id: number, @GetUser() user: User) {
    return this.ticketsService.findOne(id, user);
  }

  @Post(':id/resend-email')
  @ApiOperation({ summary: 'Resend ticket confirmation email' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Email sent' })
  resendEmail(@Param('id', ParseIntPipe) id: number, @GetUser() user: User) {
    return this.ticketsService.resendEmail(id, user);
  }
}
