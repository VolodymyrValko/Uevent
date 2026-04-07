import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { Ticket } from '../tickets/ticket.entity';
import { EventSubscription } from '../events/event-subscription.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Ticket, EventSubscription])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
