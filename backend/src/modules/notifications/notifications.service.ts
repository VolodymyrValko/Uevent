import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Notification, NotificationType } from './notification.entity';
import { paginate, PaginatedResult } from '../../common/dto/pagination.dto';

interface CreateNotificationDto {
  title: string;
  body: string;
  type: NotificationType;
  relatedEventId?: number;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepo: Repository<Notification>,
  ) {}

  async create(userId: number, dto: CreateNotificationDto): Promise<Notification> {
    return this.notificationsRepo.save(
      this.notificationsRepo.create({ ...dto, userId }),
    );
  }

  async createBulk(userIds: number[], dto: CreateNotificationDto): Promise<void> {
    const notifications = userIds.map((userId) =>
      this.notificationsRepo.create({ ...dto, userId }),
    );
    await this.notificationsRepo.save(notifications);
  }

  async findAllForUser(
    userId: number,
    page = 1,
    limit = 20,
  ): Promise<PaginatedResult<Notification>> {
    const [items, total] = await this.notificationsRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return paginate(items, total, page, limit);
  }

  async markAsRead(id: number, userId: number): Promise<Notification> {
    const notification = await this.notificationsRepo.findOne({
      where: { id, userId },
    });
    if (!notification) throw new NotFoundException('Notification not found');

    notification.isRead = true;
    return this.notificationsRepo.save(notification);
  }

  async markAllAsRead(userId: number): Promise<{ updated: number }> {
    const result = await this.notificationsRepo.update(
      { userId, isRead: false },
      { isRead: true },
    );
    return { updated: result.affected ?? 0 };
  }

  async delete(id: number, userId: number): Promise<{ message: string }> {
    const notification = await this.notificationsRepo.findOne({
      where: { id, userId },
    });
    if (!notification) throw new NotFoundException('Notification not found');

    await this.notificationsRepo.remove(notification);
    return { message: 'Notification deleted' };
  }

  async getUnreadCount(userId: number): Promise<number> {
    return this.notificationsRepo.count({ where: { userId, isRead: false } });
  }

  @Cron(CronExpression.EVERY_HOUR)
  async sendEventReminders(): Promise<void> {
    const now = new Date();

    const windows = [
      { hours: 24, label: '24 hours' },
      { hours: 1,  label: '1 hour'  },
    ];

    for (const { hours, label } of windows) {
      const windowStart = new Date(now.getTime() + hours * 60 * 60 * 1000 - 5 * 60 * 1000);
      const windowEnd   = new Date(now.getTime() + hours * 60 * 60 * 1000 + 5 * 60 * 1000);

      const rows = await this.notificationsRepo.manager.query<
        Array<{ userId: number; eventTitle: string; eventId: number }>
      >(
        `SELECT t."user_id" AS "userId", e.title AS "eventTitle", e.id AS "eventId"
         FROM tickets t
         JOIN events e ON e.id = t."event_id"
         WHERE e.date >= $1 AND e.date <= $2
           AND t.status = 'active'`,
        [windowStart, windowEnd],
      );

      if (rows.length === 0) continue;

      const notifications = rows.map((r) =>
        this.notificationsRepo.create({
          userId: r.userId,
          title: `Your event starts in ${label}!`,
          body: `"${r.eventTitle}" is coming up. Don't forget to attend!`,
          type: NotificationType.EVENT_REMINDER,
          relatedEventId: r.eventId,
        }),
      );

      await this.notificationsRepo.save(notifications);
    }
  }
}
