import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from './company.entity';
import { CompanySubscription } from './company-subscription.entity';
import { CreateCompanyDto, UpdateCompanyDto } from './dto/company.dto';
import {
  BroadcastNotificationDto,
  BroadcastRecipients,
  BroadcastDelivery,
} from './dto/broadcast.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/notification.entity';
import { MailService } from '../notifications/mail.service';
import { User } from '../users/user.entity';
import { Ticket, TicketStatus } from '../tickets/ticket.entity';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private readonly companiesRepo: Repository<Company>,
    @InjectRepository(CompanySubscription)
    private readonly subRepo: Repository<CompanySubscription>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Ticket)
    private readonly ticketsRepo: Repository<Ticket>,
    private readonly notificationsService: NotificationsService,
    private readonly mailService: MailService,
  ) {}

  async create(dto: CreateCompanyDto, userId: number, logoPath?: string): Promise<Company> {
    const company = this.companiesRepo.create({ ...dto, userId, logo: logoPath ?? null });
    return this.companiesRepo.save(company);
  }

  async findById(id: number): Promise<Company> {
    const company = await this.companiesRepo.findOne({
      where: { id },
      relations: ['owner', 'events'],
    });
    if (!company) throw new NotFoundException(`Company #${id} not found`);
    return company;
  }

  async findByUserId(userId: number): Promise<Company[]> {
    return this.companiesRepo.find({ where: { userId }, relations: ['events'], order: { id: 'ASC' } });
  }

  async update(id: number, dto: UpdateCompanyDto, userId: number, logoPath?: string): Promise<Company> {
    const company = await this.companiesRepo.findOne({ where: { id } });
    if (!company) throw new NotFoundException(`Company #${id} not found`);
    if (company.userId !== userId) throw new ForbiddenException();
    Object.assign(company, dto);
    if (logoPath) company.logo = logoPath;
    return this.companiesRepo.save(company);
  }

  async remove(id: number, userId: number): Promise<{ message: string }> {
    const company = await this.companiesRepo.findOne({ where: { id } });
    if (!company) throw new NotFoundException(`Company #${id} not found`);
    if (company.userId !== userId) throw new ForbiddenException();
    await this.companiesRepo.remove(company);
    return { message: 'Company deleted' };
  }

  async subscribe(companyId: number, userId: number): Promise<{ message: string }> {
    const company = await this.companiesRepo.findOne({ where: { id: companyId } });
    if (!company) throw new NotFoundException(`Company #${companyId} not found`);
    const existing = await this.subRepo.findOne({ where: { companyId, userId } });
    if (existing) throw new ConflictException('Already subscribed to this organizer');
    await this.subRepo.save(this.subRepo.create({ companyId, userId }));
    return { message: 'Subscribed to organizer updates' };
  }

  async unsubscribe(companyId: number, userId: number): Promise<{ message: string }> {
    const sub = await this.subRepo.findOne({ where: { companyId, userId } });
    if (!sub) throw new NotFoundException('Subscription not found');
    await this.subRepo.remove(sub);
    return { message: 'Unsubscribed from organizer updates' };
  }

  async getSubscriptionStatus(companyId: number, userId: number): Promise<boolean> {
    const sub = await this.subRepo.findOne({ where: { companyId, userId } });
    return !!sub;
  }

  async broadcast(
    companyId: number,
    requestingUserId: number,
    dto: BroadcastNotificationDto,
  ): Promise<{ sent: number }> {
    const company = await this.companiesRepo.findOne({ where: { id: companyId } });
    if (!company) throw new NotFoundException(`Company #${companyId} not found`);
    if (company.userId !== requestingUserId) throw new ForbiddenException();

    let userIds: number[] = [];

    if (dto.recipients === BroadcastRecipients.ALL_SUBSCRIBERS) {
      const subs = await this.subRepo.find({ where: { companyId }, select: ['userId'] });
      userIds = subs.map((s) => s.userId);
    } else {
      if (!dto.eventId) {
        throw new BadRequestException('eventId is required when recipients = event_attendees');
      }
      const tickets = await this.ticketsRepo.find({
        where: { eventId: dto.eventId, status: TicketStatus.ACTIVE },
        select: ['userId'],
      });
      userIds = [...new Set(tickets.map((t) => t.userId))];
    }

    if (userIds.length === 0) return { sent: 0 };

    if (dto.delivery === BroadcastDelivery.IN_APP || dto.delivery === BroadcastDelivery.BOTH) {
      await this.notificationsService.createBulk(userIds, {
        title: dto.title,
        body: dto.body,
        type: NotificationType.ORGANIZER_NEWS,
      });
    }

    if (dto.delivery === BroadcastDelivery.EMAIL || dto.delivery === BroadcastDelivery.BOTH) {
      const users = await this.usersRepo.findBy(userIds.map((id) => ({ id })));
      await Promise.allSettled(
        users.map((u) => this.mailService.sendCustomNotification(u.email, dto.title, dto.body)),
      );
    }

    return { sent: userIds.length };
  }
}
