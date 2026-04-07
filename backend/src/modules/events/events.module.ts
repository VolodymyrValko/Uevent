import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { Event } from './event.entity';
import { EventSubscription } from './event-subscription.entity';
import { PromoCode } from './promo-code.entity';
import { Company } from '../companies/company.entity';
import { CompanySubscription } from '../companies/company-subscription.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Event,
      EventSubscription,
      PromoCode,
      Company,
      CompanySubscription,
    ]),
    NotificationsModule,
  ],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
