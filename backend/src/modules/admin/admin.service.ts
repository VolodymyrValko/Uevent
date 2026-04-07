import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { User, UserRole } from '../users/user.entity';
import { Event } from '../events/event.entity';
import { Ticket } from '../tickets/ticket.entity';
import { paginate, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Event)
    private readonly eventsRepo: Repository<Event>,
    @InjectRepository(Ticket)
    private readonly ticketsRepo: Repository<Ticket>,
  ) {}

  async getStats() {
    const [totalUsers, totalEvents, ticketStats] = await Promise.all([
      this.usersRepo.count(),
      this.eventsRepo.count(),
      this.ticketsRepo
        .createQueryBuilder('ticket')
        .select('COUNT(*)', 'totalSold')
        .addSelect('COALESCE(SUM(ticket.price), 0)', 'totalRevenue')
        .getRawOne<{ totalSold: string; totalRevenue: string }>(),
    ]);

    return {
      totalUsers,
      totalEvents,
      totalTicketsSold: parseInt(ticketStats?.totalSold ?? '0', 10),
      totalRevenue: parseFloat(ticketStats?.totalRevenue ?? '0'),
    };
  }

  async getUsers(
    page = 1,
    limit = 20,
    search?: string,
  ): Promise<PaginatedResult<User>> {
    const where = search
      ? [
          { firstName: ILike(`%${search}%`) },
          { lastName: ILike(`%${search}%`) },
          { email: ILike(`%${search}%`) },
        ]
      : {};

    const [items, total] = await this.usersRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return paginate(items, total, page, limit);
  }

  async changeUserRole(userId: number, role: UserRole): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User #${userId} not found`);
    user.role = role;
    return this.usersRepo.save(user);
  }

  async deleteUser(userId: number): Promise<{ message: string }> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User #${userId} not found`);
    if (user.role === UserRole.ADMIN) throw new Error('Cannot delete an admin user');
    await this.usersRepo.remove(user);
    return { message: 'User deleted' };
  }

  async deleteEvent(eventId: number): Promise<{ message: string }> {
    const event = await this.eventsRepo.findOne({ where: { id: eventId } });
    if (!event) throw new NotFoundException(`Event #${eventId} not found`);
    await this.eventsRepo.remove(event);
    return { message: 'Event deleted by admin' };
  }

  async getEvents(
    page = 1,
    limit = 20,
    search?: string,
  ): Promise<PaginatedResult<Event>> {
    const qb = this.eventsRepo
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.company', 'company')
      .orderBy('event.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      qb.where('event.title ILIKE :search', { search: `%${search}%` });
    }

    const [items, total] = await qb.getManyAndCount();
    return paginate(items, total, page, limit);
  }
}
