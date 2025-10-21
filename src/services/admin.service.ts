import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { ReminderStatus, PlanType, NotificationStatus } from '../../generated/prisma';

export interface DashboardStats {
  users: {
    total: number;
    free: number;
    paid: number;
  };
  reminders: {
    total: number;
    pending: number;
    sent: number;
    failed: number;
    cancelled: number;
  };
  notifications: {
    total: number;
    sent: number;
    failed: number;
    pending: number;
  };
  recentActivity: {
    recentUsers: any[];
    recentReminders: any[];
    recentNotifications: any[];
  };
}

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private readonly db: DatabaseService) {}

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      // User statistics
      const totalUsers = await this.db.user.count();
      const freeUsers = await this.db.user.count({
        where: { planType: PlanType.FREE },
      });
      const paidUsers = await this.db.user.count({
        where: { planType: PlanType.PAID },
      });

      // Reminder statistics
      const totalReminders = await this.db.reminder.count();
      const pendingReminders = await this.db.reminder.count({
        where: { status: ReminderStatus.PENDING },
      });
      const sentReminders = await this.db.reminder.count({
        where: { status: ReminderStatus.SENT },
      });
      const failedReminders = await this.db.reminder.count({
        where: { status: ReminderStatus.FAILED },
      });
      const cancelledReminders = await this.db.reminder.count({
        where: { status: ReminderStatus.CANCELLED },
      });

      // Notification statistics
      const totalNotifications = await this.db.notification.count();
      const sentNotifications = await this.db.notification.count({
        where: { status: NotificationStatus.SENT },
      });
      const failedNotifications = await this.db.notification.count({
        where: { status: NotificationStatus.FAILED },
      });
      const pendingNotifications = await this.db.notification.count({
        where: { status: NotificationStatus.PENDING },
      });

      // Recent activity
      const recentUsers = await this.db.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          phone: true,
          planType: true,
          createdAt: true,
        },
      });

      const recentReminders = await this.db.reminder.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              phone: true,
            },
          },
        },
      });

      const recentNotifications = await this.db.notification.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          reminder: {
            select: {
              message: true,
              user: {
                select: {
                  phone: true,
                },
              },
            },
          },
        },
      });

      return {
        users: {
          total: totalUsers,
          free: freeUsers,
          paid: paidUsers,
        },
        reminders: {
          total: totalReminders,
          pending: pendingReminders,
          sent: sentReminders,
          failed: failedReminders,
          cancelled: cancelledReminders,
        },
        notifications: {
          total: totalNotifications,
          sent: sentNotifications,
          failed: failedNotifications,
          pending: pendingNotifications,
        },
        recentActivity: {
          recentUsers,
          recentReminders,
          recentNotifications,
        },
      };
    } catch (error: any) {
      this.logger.error(`Error getting dashboard stats: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get all users with pagination
   */
  async getUsers(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.db.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              reminders: true,
            },
          },
        },
      }),
      this.db.user.count(),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get all reminders with pagination
   */
  async getReminders(page: number = 1, limit: number = 20, status?: ReminderStatus) {
    const skip = (page - 1) * limit;

    const where = status ? { status } : {};

    const [reminders, total] = await Promise.all([
      this.db.reminder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              phone: true,
              planType: true,
            },
          },
        },
      }),
      this.db.reminder.count({ where }),
    ]);

    return {
      reminders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get user details with reminders
   */
  async getUserDetails(userId: string) {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      include: {
        reminders: {
          orderBy: { createdAt: 'desc' },
          include: {
            notifications: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  /**
   * Cancel a reminder
   */
  async cancelReminder(reminderId: string) {
    return await this.db.reminder.update({
      where: { id: reminderId },
      data: { status: ReminderStatus.CANCELLED },
    });
  }

  /**
   * Delete a user and all their data
   */
  async deleteUser(userId: string) {
    // Delete notifications first (due to foreign key constraints)
    await this.db.notification.deleteMany({
      where: {
        reminder: {
          userId,
        },
      },
    });

    // Delete reminders
    await this.db.reminder.deleteMany({
      where: { userId },
    });

    // Delete user
    return await this.db.user.delete({
      where: { id: userId },
    });
  }

  /**
   * Update user plan
   */
  async updateUserPlan(userId: string, planType: PlanType) {
    return await this.db.user.update({
      where: { id: userId },
      data: { planType },
    });
  }
}
