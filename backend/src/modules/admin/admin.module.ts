import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '../users/user.entity';
import { Event } from '../events/event.entity';
import { Ticket } from '../tickets/ticket.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Event, Ticket])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
