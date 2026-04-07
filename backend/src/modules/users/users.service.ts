import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Ticket, TicketStatus } from '../tickets/ticket.entity';
import { EventSubscription } from '../events/event-subscription.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Ticket)
    private readonly ticketsRepo: Repository<Ticket>,
    @InjectRepository(EventSubscription)
    private readonly eventSubRepo: Repository<EventSubscription>,
  ) {}

  async findById(id: number): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User #${id} not found`);
    return user;
  }

  async updateProfile(
    userId: number,
    dto: UpdateProfileDto,
    avatarPath?: string,
  ): Promise<User> {
    const user = await this.findById(userId);
    Object.assign(user, dto);
    if (avatarPath) user.avatar = avatarPath;
    return this.usersRepo.save(user);
  }

  async removeAvatar(userId: number): Promise<User> {
    const user = await this.findById(userId);
    user.avatar = null;
    return this.usersRepo.save(user);
  }

  async getMyTickets(userId: number): Promise<Ticket[]> {
    return this.ticketsRepo.find({
      where: { userId },
      relations: ['event', 'event.company'],
      order: { purchaseDate: 'DESC' },
    });
  }

  async getMyEvents(userId: number) {
    const tickets = await this.ticketsRepo.find({
      where: { userId, status: TicketStatus.ACTIVE },
      relations: ['event', 'event.company'],
    });
    return tickets.map((t) => t.event).filter(Boolean);
  }

  async getMySubscriptions(userId: number) {
    return this.eventSubRepo.find({
      where: { userId },
      relations: ['event'],
    });
  }
}
