import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { typeOrmConfig } from './config/typeorm.config';
import { SeedModule } from './database/seed.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { EventsModule } from './modules/events/events.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { CommentsModule } from './modules/comments/comments.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { AdminModule } from './modules/admin/admin.module';
import { ReminderModule } from './modules/reminders/reminder.module';

@Module({
  imports: [

    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRootAsync({
      useFactory: () => typeOrmConfig(),
    }),

    ScheduleModule.forRoot(),

    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),

    SeedModule,

    AuthModule,
    UsersModule,
    CompaniesModule,
    EventsModule,
    TicketsModule,
    CommentsModule,
    NotificationsModule,
    PaymentsModule,
    AdminModule,
    ReminderModule,
  ],
})
export class AppModule {}
