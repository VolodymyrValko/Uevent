import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { EventsService } from './events.service';
import { Event, EventFormat, EventTheme, VisitorListVisibility } from './event.entity';
import { EventSubscription } from './event-subscription.entity';
import { PromoCode } from './promo-code.entity';
import { Company } from '../companies/company.entity';
import { CompanySubscription } from '../companies/company-subscription.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { User, UserRole } from '../users/user.entity';

const mockRepo = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  findAndCount: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  count: jest.fn(),
  increment: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    getMany: jest.fn().mockResolvedValue([]),
    getOne: jest.fn().mockResolvedValue(null),
  }),
});

const mockNotificationsService = () => ({
  create: jest.fn().mockResolvedValue(undefined),
  createBulk: jest.fn().mockResolvedValue(undefined),
});

const makeEvent = (overrides: Partial<Event> = {}): Event => ({
  id: 1,
  title: 'Test Event',
  description: 'Test description',
  format: EventFormat.CONFERENCE,
  theme: EventTheme.TECHNOLOGY,
  date: new Date(Date.now() + 86400000),
  publishDate: null,
  location: 'Kyiv, Ukraine',
  latitude: 50.45,
  longitude: 30.52,
  price: 29.99 as any,
  maxTickets: 100,
  ticketsSold: 0,
  poster: null,
  visitorListVisibility: VisitorListVisibility.EVERYONE,
  notifyOnNewVisitor: false,
  redirectAfterPurchase: null,
  companyId: 1,
  createdAt: new Date(),
  company: { id: 1, userId: 42 } as Company,
  tickets: [],
  comments: [],
  promoCodes: [],
  subscriptions: [],
  ...overrides,
});

const makeUser = (overrides: Partial<User> = {}): User => ({
  id: 42,
  email: 'organizer@example.com',
  password: 'hashed',
  firstName: 'Org',
  lastName: 'Anizer',
  avatar: null,
  role: UserRole.USER,
  showNameInEvents: true,
  isEmailConfirmed: true,
  emailConfirmationToken: null,
  refreshToken: null,
  passwordResetToken: null,
  passwordResetExpires: null,
  googleId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  company: null,
  tickets: [],
  comments: [],
  notifications: [],
  eventSubscriptions: [],
  companySubscriptions: [],
  ...overrides,
});

describe('EventsService', () => {
  let service: EventsService;
  let eventsRepo: any;
  let eventSubRepo: any;
  let promoRepo: any;
  let companiesRepo: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        { provide: getRepositoryToken(Event), useFactory: mockRepo },
        { provide: getRepositoryToken(EventSubscription), useFactory: mockRepo },
        { provide: getRepositoryToken(PromoCode), useFactory: mockRepo },
        { provide: getRepositoryToken(Company), useFactory: mockRepo },
        { provide: getRepositoryToken(CompanySubscription), useFactory: mockRepo },
        { provide: NotificationsService, useFactory: mockNotificationsService },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    eventsRepo = module.get(getRepositoryToken(Event));
    eventSubRepo = module.get(getRepositoryToken(EventSubscription));
    promoRepo = module.get(getRepositoryToken(PromoCode));
    companiesRepo = module.get(getRepositoryToken(Company));
  });

  afterEach(() => jest.clearAllMocks());

  describe('findOne', () => {
    it('returns event with isSubscribed=false for unauthenticated user', async () => {
      const event = makeEvent();
      eventsRepo.findOne.mockResolvedValue(event);

      const result = await service.findOne(1);

      expect(result.id).toBe(1);
      expect(result.isSubscribed).toBe(false);
    });

    it('throws NotFoundException when event not found', async () => {
      eventsRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });

    it('returns isSubscribed=true for subscribed user', async () => {
      const event = makeEvent();
      eventsRepo.findOne.mockResolvedValue(event);
      eventSubRepo.findOne.mockResolvedValue({ id: 1, userId: 5, eventId: 1 });

      const result = await service.findOne(1, 5);

      expect(result.isSubscribed).toBe(true);
    });
  });

  describe('create', () => {
    const dto = {
      title: 'New Event',
      description: 'Desc',
      format: EventFormat.WORKSHOP,
      theme: EventTheme.TECHNOLOGY,
      date: new Date(Date.now() + 86400000 * 7).toISOString(),
      location: 'Kyiv',
      price: 0,
      maxTickets: 50,
    };

    it('throws BadRequestException when user has no company', async () => {
      companiesRepo.findOne.mockResolvedValue(null);

      await expect(service.create(dto as any, 42)).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException for past date', async () => {
      companiesRepo.findOne.mockResolvedValue({ id: 1, userId: 42 });

      await expect(
        service.create({ ...dto, date: '2020-01-01T00:00:00Z' } as any, 42),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates and returns event', async () => {
      const company = { id: 1, userId: 42 };
      companiesRepo.findOne.mockResolvedValue(company);
      const event = makeEvent();
      eventsRepo.create.mockReturnValue(event);
      eventsRepo.save.mockResolvedValue(event);

      const companySubRepo = (service as any).companySubRepo;
      if (companySubRepo) companySubRepo.find = jest.fn().mockResolvedValue([]);

      const result = await service.create(dto as any, 42);

      expect(eventsRepo.save).toHaveBeenCalled();
      expect(result.id).toBe(1);
    });
  });

  describe('remove', () => {
    it('throws ForbiddenException when user is not the owner', async () => {
      const event = makeEvent({ company: { id: 1, userId: 99 } as Company });
      eventsRepo.findOne.mockResolvedValue(event);
      const nonOwner = makeUser({ id: 42, role: UserRole.USER });

      await expect(service.remove(1, nonOwner)).rejects.toThrow(ForbiddenException);
    });

    it('allows admin to delete any event', async () => {
      const event = makeEvent();
      eventsRepo.findOne.mockResolvedValue(event);
      eventsRepo.remove.mockResolvedValue(event);
      const admin = makeUser({ role: UserRole.ADMIN });

      const result = await service.remove(1, admin);

      expect(eventsRepo.remove).toHaveBeenCalledWith(event);
      expect(result.message).toContain('deleted');
    });
  });

  describe('validatePromoCode', () => {
    it('returns valid=false when code not found', async () => {
      promoRepo.findOne.mockResolvedValue(null);
      const result = await service.validatePromoCode('INVALID', 1);
      expect(result.valid).toBe(false);
    });

    it('returns valid=false when max uses exceeded', async () => {
      promoRepo.findOne.mockResolvedValue({
        code: 'USED', discountPercent: 20, maxUses: 10, currentUses: 10, expiresAt: null,
      });
      const result = await service.validatePromoCode('USED', 1);
      expect(result.valid).toBe(false);
    });

    it('returns valid=false when code expired', async () => {
      promoRepo.findOne.mockResolvedValue({
        code: 'OLD', discountPercent: 20, maxUses: 10, currentUses: 0,
        expiresAt: new Date('2020-01-01'),
      });
      const result = await service.validatePromoCode('OLD', 1);
      expect(result.valid).toBe(false);
    });

    it('returns valid=true with discountPercent for valid code', async () => {
      promoRepo.findOne.mockResolvedValue({
        code: 'SUMMER25', discountPercent: 25, maxUses: 100, currentUses: 5, expiresAt: null,
      });
      const result = await service.validatePromoCode('SUMMER25', 1);
      expect(result.valid).toBe(true);
      expect(result.discountPercent).toBe(25);
    });
  });

  describe('subscribe', () => {
    it('creates subscription', async () => {
      eventsRepo.findOne.mockResolvedValue(makeEvent());
      eventSubRepo.findOne.mockResolvedValue(null);
      eventSubRepo.create.mockReturnValue({ userId: 5, eventId: 1 });
      eventSubRepo.save.mockResolvedValue({});

      const result = await service.subscribe(1, 5);

      expect(eventSubRepo.save).toHaveBeenCalled();
      expect(result.message).toContain('Subscribed');
    });

    it('throws NotFoundException when event does not exist', async () => {
      eventsRepo.findOne.mockResolvedValue(null);

      await expect(service.subscribe(999, 5)).rejects.toThrow(NotFoundException);
    });
  });
});
