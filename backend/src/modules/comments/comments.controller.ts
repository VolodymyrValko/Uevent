import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Query,
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
  ApiBody,
} from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { User } from '../users/user.entity';

class CreateCommentDto {
  @ApiProperty({ example: 'Fantastic event, learned so much!' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  text: string;
}

@ApiTags('comments')
@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get('events/:eventId/comments')
  @ApiOperation({ summary: 'Get paginated comments for an event' })
  @ApiParam({ name: 'eventId', type: Number })
  @ApiResponse({ status: 200, description: 'Paginated comments' })
  findAll(
    @Param('eventId', ParseIntPipe) eventId: number,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.commentsService.findAllForEvent(eventId, +page, +limit);
  }

  @Post('events/:eventId/comments')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Add a comment to an event' })
  @ApiParam({ name: 'eventId', type: Number })
  @ApiResponse({ status: 201, description: 'Comment created' })
  create(
    @Param('eventId', ParseIntPipe) eventId: number,
    @Body() dto: CreateCommentDto,
    @GetUser() user: User,
  ) {
    return this.commentsService.create(eventId, dto.text, user.id);
  }

  @Delete('comments/:id')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete own comment (or any comment if admin)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Comment deleted' })
  @ApiResponse({ status: 403, description: 'Not your comment' })
  remove(@Param('id', ParseIntPipe) id: number, @GetUser() user: User) {
    return this.commentsService.remove(id, user);
  }
}
