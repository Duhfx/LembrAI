import { Injectable } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { Notification, NotificationType, NotificationStatus } from '../../generated/prisma';

interface CreateNotificationDto {
  reminderId: string;
  type: NotificationType;
}

@Injectable()
export class NotificationService {
  constructor(private readonly db: DatabaseService) {}

  async create(data: CreateNotificationDto): Promise<Notification> {
    return this.db.notification.create({
      data: {
        ...data,
        status: 'PENDING',
      },
    });
  }

  async findById(id: string): Promise<Notification | null> {
    return this.db.notification.findUnique({
      where: { id },
      include: {
        reminder: true,
      },
    });
  }

  async findByReminderId(reminderId: string): Promise<Notification[]> {
    return this.db.notification.findMany({
      where: { reminderId },
    });
  }

  async updateStatus(
    id: string,
    status: NotificationStatus,
    error?: string,
  ): Promise<Notification> {
    return this.db.notification.update({
      where: { id },
      data: {
        status,
        sentAt: status === 'SENT' ? new Date() : undefined,
        error,
      },
    });
  }

  async findPending(): Promise<Notification[]> {
    return this.db.notification.findMany({
      where: { status: 'PENDING' },
      include: {
        reminder: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async findAll(filters?: { status?: NotificationStatus }): Promise<Notification[]> {
    return this.db.notification.findMany({
      where: filters,
      include: {
        reminder: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
