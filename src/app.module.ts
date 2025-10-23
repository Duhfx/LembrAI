import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { DatabaseService, UserService, ReminderService, NotificationService, WhatsAppService, ParseDateTimeService, ParseDateTimePtService, AIReminderParserService, AudioTranscriptionService, GeminiConversationService, ConversationContextService, ChatbotService, ReminderSchedulerService, AdminService, PlanLimitsService, ReminderQueryService } from './services';
import { WebhookController, AdminController } from './controllers';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/',
    }),
  ],
  controllers: [WebhookController, AdminController],
  providers: [DatabaseService, UserService, ReminderService, NotificationService, WhatsAppService, ParseDateTimeService, ParseDateTimePtService, AIReminderParserService, AudioTranscriptionService, GeminiConversationService, ConversationContextService, ChatbotService, ReminderSchedulerService, AdminService, PlanLimitsService, ReminderQueryService],
  exports: [DatabaseService, UserService, ReminderService, NotificationService, WhatsAppService, ParseDateTimeService, ParseDateTimePtService, AIReminderParserService, AudioTranscriptionService, GeminiConversationService, ConversationContextService, ChatbotService, ReminderSchedulerService, AdminService, PlanLimitsService, ReminderQueryService],
})
export class AppModule {}
