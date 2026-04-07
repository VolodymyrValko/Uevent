import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Ticket, TicketStatus } from '../tickets/ticket.entity';
import { MailService } from '../notifications/mail.service';

@Injectable()
export class ReminderService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketsRepo: Repository<Ticket>,
    private readonly mailService: MailService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async sendReminders(): Promise<void> {
    const now = new Date();
    const from = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const to = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    const tickets = await this.ticketsRepo.find({
      where: {
        status: TicketStatus.ACTIVE,
        event: { date: Between(from, to) },
      },
      relations: ['event', 'user'],
    });

    for (const ticket of tickets) {
      if (!ticket.user?.email || !ticket.event) continue;
      await this.mailService.sendEventReminder(
        ticket.user.email,
        ticket.event.title,
        ticket.event.date,
        ticket.id,
        ticket.qrCode,
      );
    }
  }
}
