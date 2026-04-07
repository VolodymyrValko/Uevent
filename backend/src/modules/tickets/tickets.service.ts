import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as QRCode from 'qrcode';
import { Ticket } from './ticket.entity';
import { User, UserRole } from '../users/user.entity';
import { MailService } from '../notifications/mail.service';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketsRepo: Repository<Ticket>,
    private readonly mailService: MailService,
  ) {}

  async findMyTickets(userId: number): Promise<Ticket[]> {
    return this.ticketsRepo.find({
      where: { userId },
      relations: ['event', 'event.company'],
      order: { purchaseDate: 'DESC' },
    });
  }

  async findOne(id: number, user: User): Promise<Ticket & { qrCodeDataUrl: string }> {
    const ticket = await this.ticketsRepo.findOne({
      where: { id },
      relations: ['event', 'event.company', 'user'],
    });

    if (!ticket) throw new NotFoundException(`Ticket #${id} not found`);

    const isOwner = ticket.userId === user.id;
    const isAdmin = user.role === UserRole.ADMIN;
    if (!isOwner && !isAdmin) throw new ForbiddenException();

    const qrCodeDataUrl = await QRCode.toDataURL(ticket.qrCode, {
      width: 300,
      margin: 2,
      color: { dark: '#1a1a2e', light: '#ffffff' },
    });

    return { ...ticket, qrCodeDataUrl };
  }

  async resendEmail(id: number, user: User): Promise<{ ok: boolean }> {
    const ticket = await this.ticketsRepo.findOne({
      where: { id },
      relations: ['event', 'user'],
    });

    if (!ticket) throw new NotFoundException(`Ticket #${id} not found`);
    if (ticket.userId !== user.id) throw new ForbiddenException();

    await this.mailService.sendTicketConfirmation(
      ticket.user.email,
      ticket.event.title,
      ticket.event.date,
      ticket.qrCode,
      ticket.id,
    );

    return { ok: true };
  }
}
