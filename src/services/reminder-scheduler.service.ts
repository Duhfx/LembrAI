import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as cron from 'node-cron';
import { ReminderService } from './reminder.service';
import { NotificationService } from './notification.service';
import { WhatsAppService } from './whatsapp.service';
import { UserService } from './user.service';

@Injectable()
export class ReminderSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(ReminderSchedulerService.name);
  private cronJob: cron.ScheduledTask | null = null;

  constructor(
    private readonly reminderService: ReminderService,
    private readonly notificationService: NotificationService,
    private readonly whatsappService: WhatsAppService,
    private readonly userService: UserService,
  ) {}

  /**
   * Initialize scheduler when module starts
   */
  onModuleInit() {
    this.startScheduler();
  }

  /**
   * Start the scheduler - runs every minute
   */
  startScheduler(): void {
    if (this.cronJob) {
      this.logger.warn('Scheduler already running');
      return;
    }

    // Run every minute
    this.cronJob = cron.schedule('* * * * *', async () => {
      await this.checkAndSendReminders();
    });

    this.logger.log('✅ Reminder scheduler started (runs every minute)');
  }

  /**
   * Stop the scheduler
   */
  stopScheduler(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      this.logger.log('⏹️  Reminder scheduler stopped');
    }
  }

  /**
   * Check for pending reminders and send them
   */
  async checkAndSendReminders(): Promise<void> {
    try {
      // Find reminders that should be sent now
      const pendingReminders = await this.reminderService.findPendingReminders();

      if (pendingReminders.length === 0) {
        return;
      }

      this.logger.log(`📋 Found ${pendingReminders.length} pending reminder(s) to send`);

      // Process each reminder
      for (const reminder of pendingReminders) {
        await this.processReminder(reminder);
      }
    } catch (error: any) {
      this.logger.error(`Error checking reminders: ${error.message}`, error.stack);
    }
  }

  /**
   * Process a single reminder
   */
  private async processReminder(reminder: any): Promise<void> {
    try {
      this.logger.log(`📤 Processing reminder ${reminder.id}: "${reminder.message}"`);

      // Get user info
      const user = reminder.user || await this.userService.findById(reminder.userId);

      if (!user) {
        this.logger.error(`User not found for reminder ${reminder.id}`);
        await this.reminderService.updateStatus(reminder.id, 'FAILED');
        return;
      }

      // Create notification record
      const notification = await this.notificationService.create({
        reminderId: reminder.id,
        type: 'WHATSAPP',
      });

      // Try to send via WhatsApp
      try {
        await this.whatsappService.sendReminderNotification(
          user.phone,
          reminder.message,
          reminder.originalDatetime,
        );

        // Mark as sent
        await this.notificationService.updateStatus(notification.id, 'SENT');
        await this.reminderService.updateStatus(reminder.id, 'SENT');

        this.logger.log(`✅ Reminder ${reminder.id} sent successfully to ${user.phone}`);
      } catch (error: any) {
        this.logger.error(`Failed to send reminder ${reminder.id}: ${error.message}`);

        // Mark notification as failed
        await this.notificationService.updateStatus(notification.id, 'FAILED', error.message);

        // Check retry count - for now, mark as failed after first attempt
        // TODO: Implement retry logic with exponential backoff
        await this.reminderService.updateStatus(reminder.id, 'FAILED');
      }
    } catch (error: any) {
      this.logger.error(`Error processing reminder ${reminder.id}: ${error.message}`, error.stack);
    }
  }

  /**
   * Manually trigger reminder check (useful for testing)
   */
  async triggerCheck(): Promise<void> {
    this.logger.log('🔄 Manual trigger: checking reminders...');
    await this.checkAndSendReminders();
  }
}
