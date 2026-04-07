import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './comment.entity';
import { User, UserRole } from '../users/user.entity';
import { paginate, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentsRepo: Repository<Comment>,
  ) {}

  async findAllForEvent(
    eventId: number,
    page = 1,
    limit = 20,
  ): Promise<PaginatedResult<Comment>> {
    const [items, total] = await this.commentsRepo.findAndCount({
      where: { eventId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return paginate(items, total, page, limit);
  }

  async create(eventId: number, text: string, userId: number): Promise<Comment> {
    const comment = this.commentsRepo.create({ eventId, text, userId });
    return this.commentsRepo.save(comment);
  }

  async remove(id: number, user: User): Promise<{ message: string }> {
    const comment = await this.commentsRepo.findOne({ where: { id } });
    if (!comment) throw new NotFoundException('Comment not found');

    const isOwner = comment.userId === user.id;
    const isAdmin = user.role === UserRole.ADMIN;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.commentsRepo.remove(comment);
    return { message: 'Comment deleted' };
  }
}
