import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { User } from '../modules/users/user.entity';
import { Company } from '../modules/companies/company.entity';
import { Event } from '../modules/events/event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Company, Event])],
  providers: [SeedService],
})
export class SeedModule {}
