import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { v4 as uuidv4 } from 'uuid';
import { Ticket, TicketStatus } from '../tickets/ticket.entity';
import { Event } from '../events/event.entity';
import { User } from '../users/user.entity';
import { PromoCode } from '../events/promo-code.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { MailService } from '../notifications/mail.service';
import { NotificationType } from '../notifications/notification.entity';

@Injectable()
export class PaymentsService {
  private readonly stripe: Stripe;

  constructor(
    @InjectRepository(Ticket)
    private readonly ticketsRepo: Repository<Ticket>,
    @InjectRepository(Event)
    private readonly eventsRepo: Repository<Event>,
    @InjectRepository(PromoCode)
    private readonly promoRepo: Repository<PromoCode>,
    private readonly notificationsService: NotificationsService,
    private readonly mailService: MailService,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? 'sk_test_dummy', {
      apiVersion: '2025-02-24.acacia',
    });
  }

  async createCheckoutSession(
    eventId: number,
    user: User,
    promoCode?: string,
  ): Promise<{ sessionId?: string; url?: string; mockMode?: boolean }> {
    const event = await this.eventsRepo.findOne({ where: { id: eventId } });
    if (!event) throw new NotFoundException(`Event #${eventId} not found`);

    const available = event.maxTickets - event.ticketsSold;
    if (available <= 0) throw new BadRequestException('No tickets available for this event');

    let finalPrice = Number(event.price);

    if (promoCode) {
      const promo = await this.promoRepo.findOne({ where: { code: promoCode, eventId } });
      if (promo && promo.currentUses < promo.maxUses) {
        if (!promo.expiresAt || promo.expiresAt > new Date()) {
          finalPrice = finalPrice * (1 - promo.discountPercent / 100);
        }
      }
    }

    if (finalPrice === 0) {
      const ticket = await this.createTicket(event, user, 0, promoCode);
      return { mockMode: true, url: `/tickets/${ticket.id}` };
    }

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';

    if (process.env.NODE_ENV !== 'production') {
      return {
        mockMode: true,
        url: `/payment/mock?eventId=${eventId}&price=${finalPrice.toFixed(2)}&promoCode=${promoCode ?? ''}`,
      };
    }

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: event.title, description: event.location },
            unit_amount: Math.round(finalPrice * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${frontendUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/events/${eventId}`,
      metadata: {
        eventId: String(eventId),
        userId: String(user.id),
        promoCode: promoCode ?? '',
        finalPrice: String(finalPrice),
      },
    });

    return { sessionId: session.id, url: session.url ?? undefined };
  }

  async mockPay(
    eventId: number,
    user: User,
    price: number,
    promoCode?: string,
  ): Promise<{ ticket: Ticket; redirectUrl?: string }> {
    const event = await this.eventsRepo.findOne({ where: { id: eventId } });
    if (!event) throw new NotFoundException(`Event #${eventId} not found`);

    const available = event.maxTickets - event.ticketsSold;
    if (available <= 0) throw new BadRequestException('No tickets available');

    const ticket = await this.createTicket(event, user, price, promoCode);
    return {
      ticket,
      redirectUrl: event.redirectAfterPurchase ?? undefined,
    };
  }

  async handleWebhook(rawBody: Buffer, signature: string): Promise<void> {
    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET ?? '',
      );
    } catch {
      throw new BadRequestException('Invalid webhook signature');
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const { eventId, userId, promoCode, finalPrice } = session.metadata ?? {};

      const dbEvent = await this.eventsRepo.findOne({ where: { id: +eventId } });
      const user = { id: +userId } as User;

      if (dbEvent) {
        await this.createTicket(dbEvent, user, parseFloat(finalPrice), promoCode || undefined);
      }
    }
  }

  private async createTicket(
    event: Event,
    user: User,
    price: number,
    promoCode?: string,
  ): Promise<Ticket> {

    const qrCode = `TKT-${uuidv4()}`;

    await this.eventsRepo.increment({ id: event.id }, 'ticketsSold', 1);

    if (promoCode) {
      await this.promoRepo.increment({ code: promoCode, eventId: event.id }, 'currentUses', 1);
    }

    const ticket = await this.ticketsRepo.save(
      this.ticketsRepo.create({
        userId: user.id,
        eventId: event.id,
        qrCode,
        price,
        status: TicketStatus.ACTIVE,
      }),
    );

    const fullUser = await this.ticketsRepo.manager
      .getRepository(User)
      .findOne({ where: { id: user.id } });

    if (fullUser) {
      await this.mailService.sendTicketConfirmation(
        fullUser.email,
        event.title,
        event.date,
        qrCode,
        ticket.id,
      );
    }

    await this.notificationsService.create(user.id, {
      title: 'Ticket confirmed!',
      body: `Your ticket for "${event.title}" has been confirmed.`,
      type: NotificationType.TICKET_PURCHASED,
      relatedEventId: event.id,
    });

    if (event.notifyOnNewVisitor) {
      const company = await this.eventsRepo.manager
        .createQueryBuilder()
        .select('c.user_id', 'userId')
        .from('companies', 'c')
        .where('c.id = :id', { id: event.companyId })
        .getRawOne<{ userId: number } | undefined>();

      if (company?.userId) {
        await this.notificationsService.create(company.userId, {
          title: 'New ticket sold!',
          body: `Someone just purchased a ticket for "${event.title}"`,
          type: NotificationType.NEW_VISITOR,
          relatedEventId: event.id,
        });
      }
    }

    return ticket;
  }
}
