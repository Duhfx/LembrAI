import { Injectable } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { User, PlanType } from '../../generated/prisma';

@Injectable()
export class UserService {
  constructor(private readonly db: DatabaseService) {}

  async create(phone: string, email?: string, planType: PlanType = 'FREE'): Promise<User> {
    return this.db.user.create({
      data: {
        phone,
        email,
        planType,
      },
    });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.db.user.findUnique({
      where: { phone },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.db.user.findUnique({
      where: { id },
    });
  }

  async findAll(): Promise<User[]> {
    return this.db.user.findMany();
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    return this.db.user.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<User> {
    return this.db.user.delete({
      where: { id },
    });
  }

  async countActiveReminders(userId: string): Promise<number> {
    return this.db.reminder.count({
      where: {
        userId,
        status: { in: ['PENDING', 'SENT'] },
      },
    });
  }
}
