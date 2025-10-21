import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { DatabaseService, UserService, ReminderService, NotificationService, WhatsAppService, ParseDateTimeService, ParseDateTimePtService, ConversationContextService, ChatbotService, ReminderSchedulerService, AdminService, PlanLimitsService } from './services';
import { WebhookController, AdminController } from './controllers';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/',
    }),
  ],
  controllers: [WebhookController, AdminController],
  providers: [DatabaseService, UserService, ReminderService, NotificationService, WhatsAppService, ParseDateTimeService, ParseDateTimePtService, ConversationContextService, ChatbotService, ReminderSchedulerService, AdminService, PlanLimitsService],
  exports: [DatabaseService, UserService, ReminderService, NotificationService, WhatsAppService, ParseDateTimeService, ParseDateTimePtService, ConversationContextService, ChatbotService, ReminderSchedulerService, AdminService, PlanLimitsService],
})
export class AppModule {}
