import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { EventsService } from './events.service';
import { CreateEventDto, UpdateEventDto } from './dto/create-event.dto';
import { QueryEventsDto } from './dto/query-events.dto';
import { CreatePromoCodeDto } from './dto/promo-code.dto';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { User } from '../users/user.entity';
import { imageUploadOptions } from '../../common/utils/file-upload.util';

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'List events with filtering, sorting and pagination' })
  @ApiResponse({ status: 200, description: 'Paginated list of events' })
  findAll(@Query() query: QueryEventsDto, @GetUser() user?: User) {
    return this.eventsService.findAll(query, user?.id);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get event details with organizer, comments and similar events' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Event details' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  findOne(@Param('id', ParseIntPipe) id: number, @GetUser() user?: User) {
    return this.eventsService.findOne(id, user?.id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('poster', imageUploadOptions('events')))
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a new event (requires company)' })
  @ApiResponse({ status: 201, description: 'Event created' })
  @ApiResponse({ status: 400, description: 'No company or invalid data' })
  create(
    @Body() dto: CreateEventDto,
    @GetUser() user: User,
    @UploadedFile() poster?: Express.Multer.File,
  ) {
    const posterPath = poster
      ? `/uploads/events/${poster.filename}`
      : dto.posterUrl ?? undefined;
    return this.eventsService.create(dto, user.id, posterPath);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('poster', imageUploadOptions('events')))
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update event (owner only)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Event updated' })
  @ApiResponse({ status: 403, description: 'Not the event owner' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEventDto,
    @GetUser() user: User,
    @UploadedFile() poster?: Express.Multer.File,
  ) {
    const posterPath = poster
      ? `/uploads/events/${poster.filename}`
      : dto.posterUrl ?? undefined;
    return this.eventsService.update(id, dto, user, posterPath);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete event (owner or admin)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Event deleted' })
  remove(@Param('id', ParseIntPipe) id: number, @GetUser() user: User) {
    return this.eventsService.remove(id, user);
  }

  @Get(':id/similar')
  @ApiOperation({ summary: 'Get similar events (same theme or format)' })
  @ApiParam({ name: 'id', type: Number })
  findSimilar(@Param('id', ParseIntPipe) id: number) {
    return this.eventsService.findSimilar(id);
  }

  @Get(':id/attendees')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get event attendees (respects visibility setting)' })
  @ApiParam({ name: 'id', type: Number })
  getAttendees(@Param('id', ParseIntPipe) id: number, @GetUser() user?: User) {
    return this.eventsService.getAttendees(id, user?.id);
  }

  @Post(':id/subscribe')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Subscribe to event updates' })
  @ApiParam({ name: 'id', type: Number })
  subscribe(@Param('id', ParseIntPipe) id: number, @GetUser() user: User) {
    return this.eventsService.subscribe(id, user.id);
  }

  @Delete(':id/subscribe')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Unsubscribe from event updates' })
  @ApiParam({ name: 'id', type: Number })
  unsubscribe(@Param('id', ParseIntPipe) id: number, @GetUser() user: User) {
    return this.eventsService.unsubscribe(id, user.id);
  }

  @Post(':id/promo-codes')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create promo code for event (owner only)' })
  @ApiParam({ name: 'id', type: Number })
  createPromoCode(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreatePromoCodeDto,
    @GetUser() user: User,
  ) {
    return this.eventsService.createPromoCode(id, dto, user.id);
  }

  @Get(':id/promo-codes')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List promo codes for event (owner only)' })
  @ApiParam({ name: 'id', type: Number })
  getPromoCodes(@Param('id', ParseIntPipe) id: number, @GetUser() user: User) {
    return this.eventsService.getPromoCodes(id, user.id);
  }

  @Post('promo-codes/validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate a promo code and get discount percentage' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        code: { type: 'string', example: 'SUMMER25' },
        eventId: { type: 'number', example: 1 },
      },
    },
  })
  validatePromoCode(@Body() body: { code: string; eventId: number }) {
    return this.eventsService.validatePromoCode(body.code, body.eventId);
  }

  @Delete('promo-codes/:id')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete a promo code (owner only)' })
  @ApiParam({ name: 'id', type: Number })
  deletePromoCode(@Param('id', ParseIntPipe) id: number, @GetUser() user: User) {
    return this.eventsService.deletePromoCode(id, user.id);
  }
}
