import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
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
  ApiParam,
} from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto, UpdateCompanyDto } from './dto/company.dto';
import { BroadcastNotificationDto } from './dto/broadcast.dto';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { User } from '../users/user.entity';
import { imageUploadOptions } from '../../common/utils/file-upload.util';

@ApiTags('companies')
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('logo', imageUploadOptions('logos')))
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a company (one per user)' })
  @ApiResponse({ status: 201, description: 'Company created' })
  @ApiResponse({ status: 409, description: 'User already has a company' })
  create(
    @Body() dto: CreateCompanyDto,
    @GetUser() user: User,
    @UploadedFile() logo?: Express.Multer.File,
  ) {
    const logoPath = logo ? `/uploads/logos/${logo.filename}` : undefined;
    return this.companiesService.create(dto, user.id, logoPath);
  }

  @Get('my')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: "Get all companies owned by the current user" })
  @ApiResponse({ status: 200, description: 'Array of companies' })
  findMine(@GetUser() user: User) {
    return this.companiesService.findByUserId(user.id);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get company profile with all their events' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Company profile' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.companiesService.findById(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('logo', imageUploadOptions('logos')))
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update company info (owner only)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Updated company' })
  @ApiResponse({ status: 403, description: 'Not the company owner' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCompanyDto,
    @GetUser() user: User,
    @UploadedFile() logo?: Express.Multer.File,
  ) {
    const logoPath = logo ? `/uploads/logos/${logo.filename}` : undefined;
    return this.companiesService.update(id, dto, user.id, logoPath);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete company (owner only)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Company deleted' })
  @ApiResponse({ status: 403, description: 'Not the company owner' })
  remove(@Param('id', ParseIntPipe) id: number, @GetUser() user: User) {
    return this.companiesService.remove(id, user.id);
  }

  @Post(':id/subscribe')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Subscribe to organizer notifications' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 201, description: 'Subscribed' })
  subscribe(@Param('id', ParseIntPipe) id: number, @GetUser() user: User) {
    return this.companiesService.subscribe(id, user.id);
  }

  @Delete(':id/subscribe')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Unsubscribe from organizer notifications' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Unsubscribed' })
  unsubscribe(@Param('id', ParseIntPipe) id: number, @GetUser() user: User) {
    return this.companiesService.unsubscribe(id, user.id);
  }

  @Post(':id/broadcast')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Broadcast a notification to subscribers or event attendees (owner only)',
    description:
      'Choose recipients (all_subscribers | event_attendees) and delivery method (in_app | email | both).',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 201, description: 'Broadcast sent — returns { sent: number }' })
  @ApiResponse({ status: 403, description: 'Not the company owner' })
  broadcast(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: BroadcastNotificationDto,
    @GetUser() user: User,
  ) {
    return this.companiesService.broadcast(id, user.id, dto);
  }
}
