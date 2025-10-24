import { Injectable, Logger } from '@nestjs/common';
import { Twilio } from 'twilio';
import { envConfig } from '../config';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly client: Twilio;
  private readonly fromNumber: string;

  constructor() {
    this.client = new Twilio(
      envConfig.twilio.accountSid,
      envConfig.twilio.authToken,
    );
    this.fromNumber = envConfig.twilio.whatsappNumber;

    this.logger.log('✅ WhatsApp Service initialized');
  }

  /**
   * Send a text message via WhatsApp (free-form, within 24h window)
   */
  async sendTextMessage(to: string, message: string): Promise<string> {
    try {
      // Format the phone number with whatsapp: prefix if not already present
      const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

      this.logger.log(`📤 Sending WhatsApp message to ${formattedTo}`);

      const result = await this.client.messages.create({
        from: this.fromNumber,
        to: formattedTo,
        body: message,
      });

      this.logger.log(`✅ Message sent successfully. SID: ${result.sid}`);
      return result.sid;
    } catch (error: any) {
      this.logger.error(`❌ Error sending WhatsApp message: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Send a WhatsApp message using an approved template
   * Templates can be sent outside the 24h messaging window
   */
  async sendTemplateMessage(
    to: string,
    contentSid: string,
    variables: Record<string, string>,
  ): Promise<string> {
    try {
      // Format the phone number with whatsapp: prefix if not already present
      const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

      this.logger.log(`📤 Sending WhatsApp template "${contentSid}" to ${formattedTo}`);

      const result = await this.client.messages.create({
        from: this.fromNumber,
        to: formattedTo,
        contentSid: contentSid,
        contentVariables: JSON.stringify(variables),
      });

      this.logger.log(`✅ Template message sent successfully. SID: ${result.sid}`);
      return result.sid;
    } catch (error: any) {
      this.logger.error(
        `❌ Error sending template message "${contentSid}": ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Send a reminder notification using approved template
   * This can be sent outside the 24h messaging window
   */
  async sendReminderNotification(
    to: string,
    reminderMessage: string,
    dateTime: Date,
  ): Promise<string> {
    const formattedDate = dateTime.toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });

    try {
      // Try to send using template (works outside 24h window)
      const templateName = envConfig.twilio.templates.reminder;

      this.logger.log(`Attempting to send reminder using template: ${templateName}`);

      return await this.sendTemplateMessage(to, templateName, {
        '1': formattedDate,
        '2': reminderMessage,
      });
    } catch (error: any) {
      this.logger.warn(
        `⚠️ Template not approved or failed. Attempting free-form message: ${error.message}`,
      );

      // Fallback to free-form message (only works within 24h window)
      const message = `🔔 *Lembrete LembrAI*\n\n📅 ${formattedDate}\n\n${reminderMessage}`;
      return this.sendTextMessage(to, message);
    }
  }

  /**
   * Send a welcome message
   */
  async sendWelcomeMessage(to: string): Promise<string> {
    const message = `👋 *Bem-vindo ao LembrAI!*\n\nOlá! Eu sou o LembrAI, seu assistente de lembretes via WhatsApp.\n\n💡 *Como usar:*\n• Me envie uma mensagem com o que você quer lembrar\n• Eu vou perguntar quando você quer ser lembrado\n• E pronto! Vou te avisar na hora certa\n\nExemplo: "Reunião com o cliente"\n\nVamos começar? 🚀`;

    return this.sendTextMessage(to, message);
  }

  /**
   * Send first contact welcome message using approved template
   * This can be sent outside the 24h messaging window
   */
  async sendFirstContactWelcome(to: string): Promise<string> {
    try {
      // Try to send using template (works outside 24h window)
      const templateName = envConfig.twilio.templates.welcome;

      this.logger.log(`Attempting to send welcome using template: ${templateName}`);

      // Welcome template doesn't have variables
      return await this.sendTemplateMessage(to, templateName, {});
    } catch (error: any) {
      this.logger.warn(
        `⚠️ Welcome template not approved or failed. Attempting free-form message: ${error.message}`,
      );

      // Fallback to free-form message (only works within 24h window)
      const message = `👋 *Bem-vindo ao LembrAI!*\n\nOlá! Eu sou o LembrAI, seu assistente inteligente de lembretes via WhatsApp. 🤖\n\n✨ *Sobre mim:*\nUso inteligência artificial para entender você de forma natural. Pode falar comigo como falaria com um amigo!\n\n💡 *Como funciona:*\nSimples! Me diga o que quer lembrar e quando. Eu entendo frases como:\n• "Me lembre de comprar leite amanhã às 15h"\n• "Reunião com cliente sexta-feira 14h"\n• Ou até áudio! 🎤\n\n📋 *Comandos úteis:*\n• /lembretes - Ver seus lembretes ativos\n• /plano - Consultar seu plano e uso\n• /cancelar - Cancelar conversa atual\n• /ajuda - Ver instruções detalhadas\n\n🚀 *Exemplo prático:*\nVocê: "Lembrar de ligar para o médico amanhã às 10h"\nEu: Entendo, crio o lembrete e te aviso no horário!\n\nVamos começar? Me diga seu primeiro lembrete! 😊`;

      return this.sendTextMessage(to, message);
    }
  }

  /**
   * Send confirmation message
   */
  async sendConfirmation(
    to: string,
    message: string,
    dateTime: Date,
  ): Promise<string> {
    const formattedDate = dateTime.toLocaleString('pt-BR', {
      dateStyle: 'full',
      timeStyle: 'short',
    });

    const confirmMessage = `✅ *Lembrete criado com sucesso!*\n\n📝 "${message}"\n📅 ${formattedDate}\n\nVou te lembrar no horário combinado! 🔔`;

    return this.sendTextMessage(to, confirmMessage);
  }

  /**
   * Send error message
   */
  async sendErrorMessage(to: string, errorType: string = 'generic'): Promise<string> {
    const messages: Record<string, string> = {
      generic: '❌ Ops! Algo deu errado. Por favor, tente novamente.',
      invalidDate: '⚠️ Não consegui entender a data/hora. Pode tentar de novo?\n\nExemplos: "amanhã às 15h", "sexta-feira 9h", "em 2 horas"',
      limitReached: '⚠️ Você atingiu o limite de 3 lembretes ativos no plano gratuito.\n\nPara criar mais lembretes, faça upgrade para o plano premium! 💎',
    };

    const message = messages[errorType] || messages.generic;
    return this.sendTextMessage(to, message);
  }
}
