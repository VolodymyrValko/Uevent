import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ticket } from '../tickets/ticket.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { ReminderService } from './reminder.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ticket]),
    NotificationsModule,
  ],
  providers: [ReminderService],
})
export class ReminderModule {}
