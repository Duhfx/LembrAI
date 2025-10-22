import { Injectable, Logger } from '@nestjs/common';
import { ConversationContextService } from './conversation-context.service';
import { UserService } from './user.service';
import { ReminderService } from './reminder.service';
import { ParseDateTimePtService } from './parse-datetime-pt.service';
import { WhatsAppService } from './whatsapp.service';
import { PlanLimitsService } from './plan-limits.service';
import { AIReminderParserService } from './ai-reminder-parser.service';
import { ConversationState, HandlerResponse } from '../models';

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
    private readonly aiParser: AIReminderParserService,
  ) {
    this.logger.log('✅ ChatbotService initialized');
  }

  /**
   * Process incoming message
   */
  async processMessage(phone: string, message: string): Promise<void> {
    this.logger.log(`📨 Processing message from ${phone}: "${message}"`);

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

    // Route to appropriate handler based on state
    let response: HandlerResponse;

    switch (context.state) {
      case ConversationState.INITIAL:
        response = await this.handleInitialState(phone, message);
        break;

      case ConversationState.WAITING_DATETIME:
        response = await this.handleWaitingDateTime(phone, message);
        break;

      case ConversationState.WAITING_ADVANCE_TIME:
        response = await this.handleWaitingAdvanceTime(phone, message);
        break;

      case ConversationState.CONFIRMING:
        response = await this.handleConfirming(phone, message);
        break;

      default:
        response = {
          message: '❌ Estado desconhecido. Digite /cancelar para recomeçar.',
          nextState: ConversationState.INITIAL,
        };
    }

    // Send response
    await this.whatsapp.sendTextMessage(phone, response.message);

    // Update state
    this.contextService.setState(phone, response.nextState);

    // Clear context if back to initial
    if (response.nextState === ConversationState.INITIAL) {
      this.contextService.clearContext(phone);
    }
  }

  /**
   * Handle INITIAL state - user sends reminder message
   */
  private async handleInitialState(phone: string, message: string): Promise<HandlerResponse> {
    const context = this.contextService.getOrCreateContext(phone);

    // Check if user can create a new reminder
    const canCreate = await this.planLimits.canCreateReminder(context.userId);

    if (!canCreate.allowed) {
      return {
        message: `⚠️ ${canCreate.reason}\n\nDigite /plano para ver seu uso atual.`,
        nextState: ConversationState.INITIAL,
      };
    }

    // Try to parse with AI first (falls back to offline if needed)
    const aiResult = await this.aiParser.parseReminder(message);

    this.logger.log(`Parser used: ${aiResult.method} | Confidence: ${aiResult.confidence}`);

    if (aiResult.dateTime && this.dateParser.validateDateTime(aiResult.dateTime)) {
      // We have a valid datetime from AI
      const reminderText = aiResult.cleanedMessage;

      // Store both message and parsed date
      this.contextService.updateContext(phone, {
        reminderMessage: reminderText,
        parsedDateTime: aiResult.dateTime,
      });

      const formattedDate = this.dateParser.formatDate(aiResult.dateTime);

      return {
        message: `📝 Entendi! Vou te lembrar sobre:\n"${reminderText}"\n\n✅ Data: ${formattedDate}\n\n⏰ Quanto tempo ANTES você quer ser avisado?\n\nExemplos:\n• 30 minutos antes\n• 1 hora antes\n• 2 horas antes\n• na hora (0 minutos)`,
        nextState: ConversationState.WAITING_ADVANCE_TIME,
      };
    }

    // If no date found or invalid, ask for it
    // Use cleaned message from AI if available
    const reminderMessage = aiResult.cleanedMessage || message;

    this.contextService.updateContext(phone, {
      reminderMessage,
    });

    return {
      message: `📝 Entendi! Vou te lembrar sobre:\n"${reminderMessage}"\n\n📅 Quando você quer ser lembrado?\n\nExemplos:\n• amanhã às 15h\n• segunda-feira 9h\n• em 2 horas\n• sexta 17h30`,
      nextState: ConversationState.WAITING_DATETIME,
    };
  }

  /**
   * Handle WAITING_DATETIME state - user sends date/time
   */
  private async handleWaitingDateTime(phone: string, message: string): Promise<HandlerResponse> {
    const context = this.contextService.getOrCreateContext(phone);

    // Parse the date/time
    const parsed = this.dateParser.parseDateTime(message);

    if (!parsed.success || !parsed.date) {
      return {
        message: `⚠️ Não consegui entender a data/hora.\n\nPor favor, tente novamente:\n\nExemplos:\n• amanhã às 15h\n• segunda-feira 9h\n• em 2 horas\n• 25/12 às 18h`,
        nextState: ConversationState.WAITING_DATETIME,
      };
    }

    // Validate date is in the future
    if (!this.dateParser.validateDateTime(parsed.date)) {
      return {
        message: `⚠️ A data deve ser no futuro e dentro de 1 ano.\n\nPor favor, informe outra data:`,
        nextState: ConversationState.WAITING_DATETIME,
      };
    }

    // Store parsed date
    this.contextService.updateContext(phone, {
      parsedDateTime: parsed.date,
    });

    const formattedDate = this.dateParser.formatDate(parsed.date);

    return {
      message: `✅ Data entendida: ${formattedDate}\n\n⏰ Quanto tempo ANTES você quer ser avisado?\n\nExemplos:\n• 30 minutos antes\n• 1 hora antes\n• 2 horas antes\n• na hora (0 minutos)`,
      nextState: ConversationState.WAITING_ADVANCE_TIME,
    };
  }

  /**
   * Handle WAITING_ADVANCE_TIME state - user sends advance time
   */
  private async handleWaitingAdvanceTime(phone: string, message: string): Promise<HandlerResponse> {
    const context = this.contextService.getOrCreateContext(phone);

    // Parse advance time
    const minutes = this.parseAdvanceTime(message);

    if (minutes === null) {
      return {
        message: `⚠️ Não consegui entender quanto tempo antes.\n\nExemplos:\n• 30 minutos\n• 1 hora\n• 2 horas\n• 0 (para ser avisado na hora exata)`,
        nextState: ConversationState.WAITING_ADVANCE_TIME,
      };
    }

    // Validate advance time based on plan limits
    const validation = await this.planLimits.validateAdvanceTime(context.userId, minutes);

    if (!validation.valid) {
      return {
        message: `⚠️ ${validation.reason}\n\nDigite /plano para ver os limites do seu plano.`,
        nextState: ConversationState.WAITING_ADVANCE_TIME,
      };
    }

    // Calculate reminder time
    const originalDate = context.parsedDateTime!;
    const reminderDate = new Date(originalDate.getTime() - minutes * 60 * 1000);

    // Store advance time
    this.contextService.updateContext(phone, {
      advanceMinutes: minutes,
    });

    const formattedOriginal = this.dateParser.formatDate(originalDate);
    const formattedReminder = this.dateParser.formatDate(reminderDate);

    const advanceText = minutes === 0
      ? 'na hora exata'
      : minutes < 60
        ? `${minutes} minutos antes`
        : `${Math.floor(minutes / 60)} hora(s) antes`;

    return {
      message: `📋 *Confirme seu lembrete:*\n\n📝 Mensagem: "${context.reminderMessage}"\n📅 Data do evento: ${formattedOriginal}\n⏰ Avisar: ${advanceText}\n🔔 Você será avisado em: ${formattedReminder}\n\n✅ Confirmar? (sim/não)`,
      nextState: ConversationState.CONFIRMING,
    };
  }

  /**
   * Handle CONFIRMING state - user confirms or cancels
   */
  private async handleConfirming(phone: string, message: string): Promise<HandlerResponse> {
    const context = this.contextService.getOrCreateContext(phone);
    const normalized = message.toLowerCase().trim();

    // Check confirmation
    if (!['sim', 's', 'yes', 'confirmar', 'ok'].includes(normalized)) {
      return {
        message: `❌ Lembrete cancelado.\n\nDigite outra mensagem para criar um novo lembrete.`,
        nextState: ConversationState.INITIAL,
      };
    }

    // Create reminder
    const originalDate = context.parsedDateTime!;
    const reminderDate = new Date(originalDate.getTime() - (context.advanceMinutes || 0) * 60 * 1000);

    try {
      const reminder = await this.reminderService.create({
        userId: context.userId,
        message: context.reminderMessage!,
        originalDatetime: originalDate,
        reminderDatetime: reminderDate,
        advanceTime: context.advanceMinutes,
      });

      this.logger.log(`✅ Reminder created: ${reminder.id}`);

      return {
        message: `✅ *Lembrete criado com sucesso!*\n\nVou te avisar em:\n${this.dateParser.formatDate(reminderDate)}\n\n💡 Você pode criar outro lembrete agora se quiser!`,
        nextState: ConversationState.INITIAL,
      };
    } catch (error: any) {
      this.logger.error(`Error creating reminder: ${error.message}`);
      return {
        message: `❌ Erro ao criar lembrete. Tente novamente mais tarde.`,
        nextState: ConversationState.INITIAL,
      };
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

  /**
   * Extract reminder text by removing date/time expressions
   */
  private extractReminderText(message: string): string {
    // Remove common date/time patterns
    let text = message;

    // Remove patterns like "amanhã às 19h", "segunda 9h", "em 2 horas"
    const patterns = [
      /\s+(amanhã|amanha)\s+(às|as|a)?\s*\d{1,2}(h|:?\d{2})?/gi,
      /\s+(hoje)\s+(às|as|a)?\s*\d{1,2}(h|:?\d{2})?/gi,
      /\s+(segunda|terca|terça|quarta|quinta|sexta|sabado|sábado|domingo)(-feira)?\s+(às|as|a)?\s*\d{1,2}(h|:?\d{2})?/gi,
      /\s+em\s+\d+\s+(minutos?|horas?|dias?)/gi,
      /\s+(às|as|a)\s*\d{1,2}(h|:?\d{2})?/gi,
      /\s+\d{1,2}(h|:?\d{2})/gi,
    ];

    patterns.forEach(pattern => {
      text = text.replace(pattern, '');
    });

    // Clean up extra spaces
    text = text.trim().replace(/\s+/g, ' ');

    // If text is too short after cleaning, return original
    if (text.length < 3) {
      return message;
    }

    return text;
  }

  /**
   * Parse advance time from message
   */
  private parseAdvanceTime(message: string): number | null {
    const normalized = message.toLowerCase().trim();

    // Try "X minutos"
    let match = normalized.match(/(\d+)\s*minutos?/);
    if (match) {
      return parseInt(match[1]);
    }

    // Try "X horas"
    match = normalized.match(/(\d+)\s*horas?/);
    if (match) {
      return parseInt(match[1]) * 60;
    }

    // Try just number (assume minutes)
    match = normalized.match(/^(\d+)$/);
    if (match) {
      return parseInt(match[1]);
    }

    // Special cases
    if (normalized.includes('na hora') || normalized === '0') {
      return 0;
    }

    return null;
  }
}
