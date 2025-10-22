import { Injectable, Logger } from '@nestjs/common';
import { ConversationContextService } from './conversation-context.service';
import { UserService } from './user.service';
import { ReminderService } from './reminder.service';
import { ParseDateTimePtService } from './parse-datetime-pt.service';
import { WhatsAppService } from './whatsapp.service';
import { PlanLimitsService } from './plan-limits.service';
import { GeminiConversationService, ConversationMessage } from './gemini-conversation.service';
import { ConversationState } from '../models';

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);

  constructor(
    private readonly contextService: ConversationContextService,
    private readonly userService: UserService,
    private readonly reminderService: ReminderService,
    private readonly dateParser: ParseDateTimePtService,
    private readonly whatsapp: WhatsAppService,
    private readonly planLimits: PlanLimitsService,
    private readonly aiConversation: GeminiConversationService,
  ) {
    this.logger.log('✅ ChatbotService initialized with AI conversation');
  }

  /**
   * Process incoming message with AI-powered conversation
   */
  async processMessage(phone: string, message: string, isFromAudio: boolean = false): Promise<void> {
    const logPrefix = isFromAudio ? '🎤' : '📨';
    this.logger.log(`${logPrefix} Processing message from ${phone}: "${message}"`);

    // Get or create context
    const context = this.contextService.getOrCreateContext(phone);

    // Ensure user exists
    if (!context.userId) {
      let user = await this.userService.findByPhone(phone);
      if (!user) {
        user = await this.userService.create(phone);
        this.logger.log(`Created new user: ${user.id}`);
      }
      this.contextService.updateContext(phone, { userId: user.id });
      context.userId = user.id;
    }

    // Handle special commands
    if (this.isCommand(message)) {
      await this.handleCommand(phone, message);
      return;
    }

    // Build conversation history for AI
    const history: ConversationMessage[] = context.messageHistory?.map(m => ({
      role: m.role,
      content: m.content,
    })) || [];

    // Get user context for AI
    const user = await this.userService.findByPhone(phone);
    const activeReminders = await this.reminderService.countActiveByUserId(context.userId);
    const monthlyReminders = await this.reminderService.countMonthlyByUserId(context.userId);

    const userContext = {
      planType: user?.planType || 'FREE',
      activeReminders,
      monthlyReminders,
    };

    // Process with AI
    const aiResult = await this.aiConversation.processConversation(
      message,
      history,
      userContext,
    );

    // Update conversation history
    const newHistory = [
      ...(context.messageHistory || []),
      { role: 'user' as const, content: message, timestamp: new Date() },
      { role: 'assistant' as const, content: aiResult.responseMessage, timestamp: new Date() },
    ];

    // Keep only last 10 messages to avoid token bloat
    if (newHistory.length > 10) {
      newHistory.splice(0, newHistory.length - 10);
    }

    this.contextService.updateContext(phone, { messageHistory: newHistory });

    // Handle AI actions
    await this.handleAIAction(phone, aiResult);
  }

  /**
   * Handle actions determined by AI
   */
  private async handleAIAction(phone: string, aiResult: any): Promise<void> {
    const context = this.contextService.getOrCreateContext(phone);

    switch (aiResult.action) {
      case 'create_reminder':
        await this.createReminderFromAI(phone, aiResult);
        break;

      case 'list_reminders':
        await this.listReminders(phone);
        break;

      case 'show_plan':
        await this.showPlanUsage(phone);
        break;

      case 'cancel':
        this.contextService.clearContext(phone);
        await this.whatsapp.sendTextMessage(phone, aiResult.responseMessage);
        break;

      case 'help':
        await this.whatsapp.sendWelcomeMessage(phone);
        break;

      case 'none':
      default:
        // Just send the AI response
        if (aiResult.responseMessage) {
          await this.whatsapp.sendTextMessage(phone, aiResult.responseMessage);
        }

        // Store partial reminder data in context for next turn
        if (aiResult.reminderData) {
          this.contextService.updateContext(phone, {
            reminderMessage: aiResult.reminderData.message,
            parsedDateTime: aiResult.reminderData.dateTime,
            advanceMinutes: aiResult.reminderData.advanceMinutes,
          });
        }
        break;
    }
  }

  /**
   * Create reminder from AI-parsed data
   */
  private async createReminderFromAI(phone: string, aiResult: any): Promise<void> {
    const context = this.contextService.getOrCreateContext(phone);

    try {
      // Merge AI data with context (context takes priority for continuity)
      const reminderMessage = context.reminderMessage || aiResult.reminderData?.message;
      const dateTime = context.parsedDateTime || aiResult.reminderData?.dateTime;
      const advanceMinutes = aiResult.reminderData?.advanceMinutes ?? context.advanceMinutes ?? 0;

      // Validate we have everything
      if (!reminderMessage || !dateTime) {
        await this.whatsapp.sendTextMessage(
          phone,
          '❌ Ops! Faltam informações. Me diga o que você quer lembrar e quando!',
        );
        return;
      }

      // Check plan limits
      const canCreate = await this.planLimits.canCreateReminder(context.userId);
      if (!canCreate.allowed) {
        await this.whatsapp.sendTextMessage(
          phone,
          `⚠️ ${canCreate.reason}\n\nDigite /plano para ver seu uso atual.`,
        );
        return;
      }

      // Validate advance time
      const advanceValidation = await this.planLimits.validateAdvanceTime(context.userId, advanceMinutes);
      if (!advanceValidation.valid) {
        await this.whatsapp.sendTextMessage(
          phone,
          `⚠️ ${advanceValidation.reason}\n\nDigite /plano para ver os limites do seu plano.`,
        );
        return;
      }

      // Calculate reminder time
      const reminderDate = new Date(dateTime.getTime() - advanceMinutes * 60 * 1000);

      // Create reminder
      const reminder = await this.reminderService.create({
        userId: context.userId,
        message: reminderMessage,
        originalDatetime: dateTime,
        reminderDatetime: reminderDate,
        advanceTime: advanceMinutes,
      });

      this.logger.log(`✅ Reminder created: ${reminder.id}`);

      // Send response (use AI message if provided, otherwise default)
      const responseMessage = aiResult.responseMessage ||
        `✅ *Lembrete criado com sucesso!*\n\nVou te avisar em:\n${this.dateParser.formatDate(reminderDate)}`;

      await this.whatsapp.sendTextMessage(phone, responseMessage);

      // Clear context
      this.contextService.clearContext(phone);

    } catch (error: any) {
      this.logger.error(`Error creating reminder: ${error.message}`);
      await this.whatsapp.sendTextMessage(
        phone,
        `❌ Erro ao criar lembrete. Tente novamente mais tarde.`,
      );
    }
  }

  /**
   * Check if message is a command
   */
  private isCommand(message: string): boolean {
    return message.startsWith('/');
  }

  /**
   * Handle special commands
   */
  private async handleCommand(phone: string, message: string): Promise<void> {
    const command = message.toLowerCase().trim();

    switch (command) {
      case '/cancelar':
      case '/cancel':
        this.contextService.clearContext(phone);
        await this.whatsapp.sendTextMessage(
          phone,
          '❌ Conversa cancelada. Envie uma mensagem para criar um novo lembrete!',
        );
        break;

      case '/ajuda':
      case '/help':
        await this.whatsapp.sendWelcomeMessage(phone);
        break;

      case '/lembretes':
      case '/list':
        await this.listReminders(phone);
        break;

      case '/plano':
      case '/plan':
      case '/uso':
      case '/usage':
        await this.showPlanUsage(phone);
        break;

      default:
        await this.whatsapp.sendTextMessage(
          phone,
          '❓ Comando desconhecido.\n\nComandos disponíveis:\n/ajuda - Ver instruções\n/cancelar - Cancelar conversa\n/lembretes - Ver seus lembretes\n/plano - Ver seu plano e uso',
        );
    }
  }

  /**
   * List user's reminders
   */
  private async listReminders(phone: string): Promise<void> {
    const user = await this.userService.findByPhone(phone);
    if (!user) {
      await this.whatsapp.sendTextMessage(phone, 'Você ainda não tem lembretes.');
      return;
    }

    const reminders = await this.reminderService.findByUserId(user.id);

    if (reminders.length === 0) {
      await this.whatsapp.sendTextMessage(phone, '📭 Você não tem lembretes ativos.');
      return;
    }

    let message = `📋 *Seus lembretes (${reminders.length}):*\n\n`;

    reminders.forEach((reminder, index) => {
      const date = this.dateParser.formatDate(reminder.reminderDatetime);
      message += `${index + 1}. ${reminder.message}\n   🔔 ${date}\n\n`;
    });

    await this.whatsapp.sendTextMessage(phone, message);
  }

  /**
   * Show plan usage information
   */
  private async showPlanUsage(phone: string): Promise<void> {
    const user = await this.userService.findByPhone(phone);
    if (!user) {
      await this.whatsapp.sendTextMessage(phone, 'Usuário não encontrado.');
      return;
    }

    const usageMessage = await this.planLimits.formatUsageMessage(user.id);
    await this.whatsapp.sendTextMessage(phone, usageMessage);
  }
}
