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
    const now = new Date();

    return this.db.reminder.findMany({
      where: {
        userId,
        status: 'PENDING',
        reminderDatetime: {
          gte: now,
        },
      },
      orderBy: { reminderDatetime: 'asc' },
    });
  }

  async findPendingReminders(): Promise<Reminder[]> {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutes buffer

    return this.db.reminder.findMany({
      where: {
        status: 'PENDING',
        reminderDatetime: {
          gte: fiveMinutesAgo, // Only get reminders from last 5 minutes
          lte: now,
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

  /**
   * Count active reminders for a user
   */
  async countActiveByUserId(userId: string): Promise<number> {
    return this.db.reminder.count({
      where: {
        userId,
        status: 'PENDING',
      },
    });
  }

  /**
   * Count reminders created by user in current month
   */
  async countMonthlyByUserId(userId: string): Promise<number> {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return this.db.reminder.count({
      where: {
        userId,
        createdAt: {
          gte: firstDayOfMonth,
        },
      },
    });
  }

  /**
   * Find reminders for a user within a date range
   */
  async findByUserIdAndPeriod(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Reminder[]> {
    return this.db.reminder.findMany({
      where: {
        userId,
        status: 'PENDING',
        reminderDatetime: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { reminderDatetime: 'asc' },
      take: 50, // Limit to 50 reminders to avoid overwhelming the user
    });
  }

  /**
   * Search pending reminders by keyword
   */
  async searchByKeyword(userId: string, keyword: string): Promise<Reminder[]> {
    const normalizedKeyword = keyword.toLowerCase().trim();

    const reminders = await this.db.reminder.findMany({
      where: {
        userId,
        status: 'PENDING',
      },
      orderBy: { reminderDatetime: 'asc' },
    });

    // Filter by keyword similarity (case-insensitive)
    return reminders.filter(reminder =>
      reminder.message.toLowerCase().includes(normalizedKeyword)
    );
  }

  /**
   * Find only pending reminders for a user
   */
  async findPendingByUserId(userId: string): Promise<Reminder[]> {
    return this.db.reminder.findMany({
      where: {
        userId,
        status: 'PENDING',
      },
      orderBy: { reminderDatetime: 'asc' },
    });
  }

  /**
   * Cancel a reminder (update status to CANCELLED)
   */
  async cancelReminder(id: string): Promise<Reminder> {
    return this.db.reminder.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }
}
