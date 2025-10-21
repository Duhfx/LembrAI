import { Injectable } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { Reminder, ReminderStatus } from '../../generated/prisma';

interface CreateReminderDto {
  userId: string;
  message: string;
  originalDatetime: Date;
  reminderDatetime: Date;
  advanceTime?: number;
}

@Injectable()
export class ReminderService {
  constructor(private readonly db: DatabaseService) {}

  async create(data: CreateReminderDto): Promise<Reminder> {
    return this.db.reminder.create({
      data: {
        ...data,
        status: 'PENDING',
      },
    });
  }

  async findById(id: string): Promise<Reminder | null> {
    return this.db.reminder.findUnique({
      where: { id },
      include: {
        user: true,
        notifications: true,
      },
    });
  }

  async findByUserId(userId: string): Promise<Reminder[]> {
    return this.db.reminder.findMany({
      where: { userId },
      orderBy: { reminderDatetime: 'asc' },
    });
  }

  async findPendingReminders(): Promise<Reminder[]> {
    return this.db.reminder.findMany({
      where: {
        status: 'PENDING',
        reminderDatetime: {
          lte: new Date(),
        },
      },
      include: {
        user: true,
      },
    });
  }

  async updateStatus(id: string, status: ReminderStatus): Promise<Reminder> {
    return this.db.reminder.update({
      where: { id },
      data: { status },
    });
  }

  async delete(id: string): Promise<Reminder> {
    return this.db.reminder.delete({
      where: { id },
    });
  }

  async findAll(filters?: { status?: ReminderStatus }): Promise<Reminder[]> {
    return this.db.reminder.findMany({
      where: filters,
      include: {
        user: true,
      },
      orderBy: { reminderDatetime: 'desc' },
    });
  }
}
