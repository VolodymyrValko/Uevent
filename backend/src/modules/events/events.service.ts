import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Event, EventFormat, EventTheme } from './event.entity';
import { EventSubscription } from './event-subscription.entity';
import { PromoCode } from './promo-code.entity';
import { Company } from '../companies/company.entity';
import { User, UserRole } from '../users/user.entity';
import { CreateEventDto, UpdateEventDto } from './dto/create-event.dto';
import { QueryEventsDto } from './dto/query-events.dto';
import { CreatePromoCodeDto } from './dto/promo-code.dto';
import { paginate, PaginatedResult } from '../../common/dto/pagination.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/notification.entity';
import { CompanySubscription } from '../companies/company-subscription.entity';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventsRepo: Repository<Event>,
    @InjectRepository(EventSubscription)
    private readonly eventSubRepo: Repository<EventSubscription>,
    @InjectRepository(PromoCode)
    private readonly promoRepo: Repository<PromoCode>,
    @InjectRepository(Company)
    private readonly companiesRepo: Repository<Company>,
    @InjectRepository(CompanySubscription)
    private readonly companySubRepo: Repository<CompanySubscription>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll(
    query: QueryEventsDto,
    currentUserId?: number,
  ): Promise<PaginatedResult<Event>> {
    const { page, limit, format, theme, dateFrom, dateTo, search, sortBy, order } = query;

    const qb: SelectQueryBuilder<Event> = this.eventsRepo
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.company', 'company')
      .where('(event.publishDate IS NULL OR event.publishDate <= NOW())')
      .andWhere('event.date >= NOW()');

    if (format) qb.andWhere('event.format = :format', { format });
    if (theme) qb.andWhere('event.theme = :theme', { theme });
    if (dateFrom) qb.andWhere('event.date >= :dateFrom', { dateFrom });
    if (dateTo) qb.andWhere('event.date <= :dateTo', { dateTo });
    if (search) {
      qb.andWhere('(event.title ILIKE :search OR event.description ILIKE :search OR event.location ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    const sortColumn = sortBy === 'price' ? 'event.price'
      : sortBy === 'title' ? 'event.title'
      : 'event.date';

    qb.orderBy(sortColumn, order?.toUpperCase() as 'ASC' | 'DESC' ?? 'ASC');
    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();
    return paginate(items, total, page, limit);
  }

  async findOne(id: number, currentUserId?: number): Promise<Event & { isSubscribed?: boolean }> {
    const event = await this.eventsRepo.findOne({
      where: { id },
      relations: ['company', 'company.owner', 'comments', 'comments.user'],
    });

    if (!event) throw new NotFoundException(`Event #${id} not found`);

    let isSubscribed = false;
    if (currentUserId) {
      const sub = await this.eventSubRepo.findOne({
        where: { userId: currentUserId, eventId: id },
      });
      isSubscribed = !!sub;
    }

    return { ...event, isSubscribed };
  }

  async create(dto: CreateEventDto, userId: number, posterPath?: string): Promise<Event> {
    const company = await this.companiesRepo.findOne({ where: { userId } });
    if (!company) {
      throw new BadRequestException('You must create a company before creating events');
    }

    const eventDate = new Date(dto.date);
    if (eventDate <= new Date()) {
      throw new BadRequestException('Event date must be in the future');
    }

    const event = this.eventsRepo.create({
      ...dto,
      date: eventDate,
      publishDate: dto.publishDate ? new Date(dto.publishDate) : null,
      poster: posterPath ?? null,
      companyId: company.id,
    });

    const saved = await this.eventsRepo.save(event);

    await this.notifyCompanySubscribers(company.id, saved);

    return saved;
  }

  async update(id: number, dto: UpdateEventDto, user: User, posterPath?: string): Promise<Event> {
    const event = await this.findOneOwned(id, user);

    if (dto.date) {
      const newDate = new Date(dto.date);
      if (newDate <= new Date()) {
        throw new BadRequestException('Event date must be in the future');
      }
    }

    Object.assign(event, {
      ...dto,
      ...(dto.date && { date: new Date(dto.date) }),
      ...(dto.publishDate && { publishDate: new Date(dto.publishDate) }),
      ...(posterPath && { poster: posterPath }),
    });

    return this.eventsRepo.save(event);
  }

  async remove(id: number, user: User): Promise<{ message: string }> {
    const event = user.role === UserRole.ADMIN
      ? await this.eventsRepo.findOne({ where: { id } })
      : await this.findOneOwned(id, user);

    if (!event) throw new NotFoundException(`Event #${id} not found`);

    await this.eventsRepo.remove(event);
    return { message: 'Event deleted successfully' };
  }

  async findSimilar(id: number, limit = 4): Promise<Event[]> {
    const event = await this.eventsRepo.findOne({ where: { id } });
    if (!event) throw new NotFoundException(`Event #${id} not found`);

    return this.eventsRepo
      .createQueryBuilder('e')
      .where('e.id != :id', { id })
      .andWhere('(e.theme = :theme OR e.format = :format)', {
        theme: event.theme,
        format: event.format,
      })
      .andWhere('e.date >= NOW()')
      .orderBy('e.date', 'ASC')
      .take(limit)
      .getMany();
  }

  async getAttendees(id: number, currentUserId?: number) {
    const event = await this.eventsRepo.findOne({
      where: { id },
      relations: ['tickets', 'tickets.user'],
    });
    if (!event) throw new NotFoundException(`Event #${id} not found`);

    const isAttendee = currentUserId
      ? event.tickets.some((t) => t.userId === currentUserId)
      : false;

    if (
      event.visitorListVisibility === 'attendees_only' &&
      !isAttendee
    ) {
      return { attendees: [], restricted: true };
    }

    const attendees = event.tickets
      .filter((t) => t.status === 'active')
      .map((t) => ({
        id: t.user.id,
        name: t.user.showNameInEvents
          ? `${t.user.firstName} ${t.user.lastName}`
          : 'Anonymous',
        avatar: t.user.avatar,
      }));

    return { attendees, restricted: false };
  }

  async subscribe(eventId: number, userId: number): Promise<{ message: string }> {
    const event = await this.eventsRepo.findOne({ where: { id: eventId } });
    if (!event) throw new NotFoundException(`Event #${eventId} not found`);

    const existing = await this.eventSubRepo.findOne({ where: { eventId, userId } });
    if (existing) throw new ConflictException('Already subscribed to this event');

    await this.eventSubRepo.save(this.eventSubRepo.create({ eventId, userId }));
    return { message: 'Subscribed to event updates' };
  }

  async unsubscribe(eventId: number, userId: number): Promise<{ message: string }> {
    const sub = await this.eventSubRepo.findOne({ where: { eventId, userId } });
    if (!sub) throw new NotFoundException('Subscription not found');

    await this.eventSubRepo.remove(sub);
    return { message: 'Unsubscribed from event updates' };
  }

  async createPromoCode(eventId: number, dto: CreatePromoCodeDto, userId: number): Promise<PromoCode> {
    const event = await this.eventsRepo.findOne({
      where: { id: eventId },
      relations: ['company'],
    });
    if (!event) throw new NotFoundException(`Event #${eventId} not found`);
    if (event.company.userId !== userId) throw new ForbiddenException();

    const existing = await this.promoRepo.findOne({ where: { code: dto.code } });
    if (existing) throw new ConflictException('Promo code already exists');

    return this.promoRepo.save(
      this.promoRepo.create({
        ...dto,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        eventId,
      }),
    );
  }

  async getPromoCodes(eventId: number, userId: number): Promise<PromoCode[]> {
    const event = await this.eventsRepo.findOne({
      where: { id: eventId },
      relations: ['company'],
    });
    if (!event) throw new NotFoundException(`Event #${eventId} not found`);
    if (event.company.userId !== userId) throw new ForbiddenException();

    return this.promoRepo.find({ where: { eventId } });
  }

  async deletePromoCode(id: number, userId: number): Promise<{ message: string }> {
    const promo = await this.promoRepo.findOne({
      where: { id },
      relations: ['event', 'event.company'],
    });
    if (!promo) throw new NotFoundException('Promo code not found');
    if (promo.event.company.userId !== userId) throw new ForbiddenException();

    await this.promoRepo.remove(promo);
    return { message: 'Promo code deleted' };
  }

  async validatePromoCode(code: string, eventId: number): Promise<{ valid: boolean; discountPercent?: number }> {
    const promo = await this.promoRepo.findOne({ where: { code, eventId } });

    if (!promo) return { valid: false };
    if (promo.currentUses >= promo.maxUses) return { valid: false };
    if (promo.expiresAt && promo.expiresAt < new Date()) return { valid: false };

    return { valid: true, discountPercent: promo.discountPercent };
  }

  private async findOneOwned(id: number, user: User): Promise<Event> {
    const event = await this.eventsRepo.findOne({
      where: { id },
      relations: ['company'],
    });
    if (!event) throw new NotFoundException(`Event #${id} not found`);
    if (event.company.userId !== user.id) throw new ForbiddenException('Not the event owner');
    return event;
  }

  private async notifyCompanySubscribers(companyId: number, event: Event): Promise<void> {
    const subs = await this.companySubRepo.find({
      where: { companyId },
      select: ['userId'],
    });

    const userIds = subs.map((s) => s.userId);
    if (userIds.length === 0) return;

    await this.notificationsService.createBulk(userIds, {
      title: 'New event from an organizer you follow',
      body: `"${event.title}" has been announced on ${event.date.toLocaleDateString()}`,
      type: NotificationType.ORGANIZER_NEWS,
      relatedEventId: event.id,
    });
  }
}
