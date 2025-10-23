import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { envConfig } from '../config/env.config';
import { ParseDateTimePtService } from './parse-datetime-pt.service';

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIConversationResult {
  responseMessage: string;
  action?: 'create_reminder' | 'list_reminders' | 'query_reminders' | 'show_plan' | 'delete_reminder' | 'cancel' | 'help' | 'none';
  reminderData?: {
    message: string;
    dateTime?: Date;
    advanceMinutes?: number;
  };
  queryPeriod?: string;
  reminderKeyword?: string;
  needsMoreInfo?: boolean;
}

/**
 * Gemini-powered conversational AI service
 * Handles natural language conversations for reminder creation
 */
@Injectable()
export class GeminiConversationService {
  private readonly logger = new Logger(GeminiConversationService.name);
  private readonly genAI: GoogleGenerativeAI | null = null;
  private readonly enabled: boolean;

  constructor(private readonly dateParser: ParseDateTimePtService) {
    if (envConfig.ai.geminiKey) {
      this.genAI = new GoogleGenerativeAI(envConfig.ai.geminiKey);
      this.enabled = true;
      this.logger.log('✅ Gemini Conversation Service enabled');
    } else {
      this.enabled = false;
      this.logger.warn('⚠️  Gemini Conversation Service disabled (no GEMINI_API_KEY)');
    }
  }

  /**
   * Process a conversation turn with AI
   */
  async processConversation(
    userMessage: string,
    conversationHistory: ConversationMessage[],
    userContext?: {
      planType?: string;
      activeReminders?: number;
      monthlyReminders?: number;
    },
  ): Promise<AIConversationResult> {
    if (!this.enabled || !this.genAI) {
      return this.fallbackResponse(userMessage);
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

      const prompt = this.buildConversationPrompt(userMessage, conversationHistory, userContext);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      this.logger.log(`🤖 AI Response: ${text.substring(0, 100)}...`);

      return this.parseAIResponse(text, userMessage);
    } catch (error: any) {
      this.logger.error(`❌ AI conversation error: ${error.message}`);
      return this.fallbackResponse(userMessage);
    }
  }

  /**
   * Build comprehensive prompt for conversation
   */
  private buildConversationPrompt(
    userMessage: string,
    history: ConversationMessage[],
    userContext?: any,
  ): string {
    const now = new Date();
    const currentDateTime = this.formatCurrentDateTime(now);

    const contextInfo = userContext
      ? `\nINFORMAÇÕES DO USUÁRIO:
- Plano: ${userContext.planType || 'FREE'}
- Lembretes ativos: ${userContext.activeReminders || 0}
- Lembretes criados este mês: ${userContext.monthlyReminders || 0}`
      : '';

    const historyText = history.length > 0
      ? `\nHISTÓRICO DA CONVERSA:
${history.map(m => `${m.role === 'user' ? 'Usuário' : 'Você'}: ${m.content}`).join('\n')}`
      : '';

    return `Você é o LembrAI, um assistente inteligente e amigável de lembretes via WhatsApp, especializado em português brasileiro.

DATA E HORA ATUAL: ${currentDateTime}${contextInfo}${historyText}

NOVA MENSAGEM DO USUÁRIO:
"${userMessage}"

⚠️ REGRAS PRINCIPAIS:
- Sempre converta termos relativos ("amanhã", "hoje", "segunda", "em 2 dias") para datas exatas com base na data/hora atual.
- Nunca peça a data completa se o usuário usar linguagem natural.
- Se faltar apenas hora → pergunte "que horas?".
- Se faltar apenas dia → pergunte "que dia?".

🎯 OBJETIVO:
Ajudar o usuário a criar e consultar lembretes de forma natural e rápida. Seja simpático e direto.

🧭 COMANDOS:
/ajuda → Explica como funciona
/cancelar → Cancela a conversa atual
/lembretes | meus lembretes → Lista lembretes ativos
/plano | ver plano → Mostra informações do plano

🔍 CONSULTAS:
Quando o usuário pergunta sobre lembretes existentes, use:
{
  "responseMessage": "Vou verificar seus lembretes para [período]...",
  "action": "query_reminders",
  "queryPeriod": "hoje | amanhã | esta semana | próximos 3 dias",
  "needsMoreInfo": false
}

🗑️ CANCELAMENTO DE LEMBRETES:
Quando o usuário quer DELETAR/CANCELAR/REMOVER um lembrete existente:
{
  "responseMessage": "Vou buscar o lembrete de [palavra-chave] para cancelar...",
  "action": "delete_reminder",
  "reminderKeyword": "palavra-chave do lembrete",
  "needsMoreInfo": false
}

**Exemplos de intenção de cancelamento:**
- "Cancela o lembrete de café"
- "Remove o lembrete de reunião"
- "Não preciso mais do lembrete de comprar leite"
- "Deleta o lembrete de academia"
- "Apaga o lembrete de ligar pro médico"

**Extraia a palavra-chave:** o termo principal do que o usuário quer cancelar
- "Cancela o lembrete de **comprar café**" → reminderKeyword: "comprar café"
- "Remove o de **reunião**" → reminderKeyword: "reunião"
- "Não quero mais o lembrete de **academia**" → reminderKeyword: "academia"

🧩 CRIAÇÃO DE LEMBRETES:
Extraia:
- message: o que lembrar
- dateTime: data e hora (obrigatório)
- advanceMinutes: antecedência (opcional)

Valide:
- Data no futuro
- Hora entre 00:00 e 23:59
- Calcule datas relativas automaticamente

💬 TOM:
Natural, amigável, curto (máx. 2-3 linhas), emojis leves. Confirme antes de salvar.

📦 FORMATO DE RESPOSTA (sempre em JSON):
{
  "responseMessage": "texto para o usuário",
  "action": "create_reminder | list_reminders | show_plan | cancel | help | none",
  "reminderData": {
    "message": "texto do lembrete",
    "dateTime": "YYYY-MM-DD HH:mm",
    "advanceMinutes": null
  },
  "needsMoreInfo": true/false
}

✅ EXEMPLOS:
Usuário: "me lembre de comprar leite amanhã às 15h"
→ {
  "responseMessage": "Perfeito! Vou te lembrar de comprar leite amanhã às 15h ⏰ Quer ser avisado quanto tempo antes?",
  "action": "none",
  "reminderData": { "message": "Comprar leite", "dateTime": "2025-10-23 15:00", "advanceMinutes": null },
  "needsMoreInfo": true
}

Usuário: "lembrete pra segunda"
→ pergunta o horário

Usuário: "30 minutos antes"
→ cria o lembrete com advanceMinutes = 30

🚫 NUNCA:
- Peça data completa
- Peça confirmação desnecessária
- Retorne texto fora do JSON`;
  }

  /**
   * Parse AI JSON response
   */
  private parseAIResponse(aiResponse: string, originalMessage: string): AIConversationResult {
    try {
      // Extract JSON from response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Parse dateTime if present
      let dateTime: Date | undefined;
      if (parsed.reminderData?.dateTime) {
        dateTime = this.parseDateTimeString(parsed.reminderData.dateTime);
        if (!dateTime || !this.dateParser.validateDateTime(dateTime)) {
          this.logger.warn(`Invalid datetime from AI: ${parsed.reminderData.dateTime}`);
          dateTime = undefined;
        }
      }

      return {
        responseMessage: parsed.responseMessage || 'Desculpe, não entendi. Pode reformular?',
        action: parsed.action || 'none',
        reminderData: parsed.reminderData ? {
          message: parsed.reminderData.message || originalMessage,
          dateTime,
          advanceMinutes: parsed.reminderData.advanceMinutes,
        } : undefined,
        queryPeriod: parsed.queryPeriod,
        reminderKeyword: parsed.reminderKeyword,
        needsMoreInfo: parsed.needsMoreInfo !== false,
      };
    } catch (error: any) {
      this.logger.error(`Failed to parse AI response: ${error.message}`);
      return this.fallbackResponse(originalMessage);
    }
  }

  /**
   * Parse datetime string "YYYY-MM-DD HH:mm"
   */
  private parseDateTimeString(dateTimeStr: string): Date | undefined {
    try {
      const match = dateTimeStr.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})$/);
      if (!match) return undefined;

      const [, year, month, day, hours, minutes] = match;
      const date = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hours),
        parseInt(minutes),
        0,
        0
      );

      return isNaN(date.getTime()) ? undefined : date;
    } catch {
      return undefined;
    }
  }

  /**
   * Format current datetime
   */
  private formatCurrentDateTime(date: Date): string {
    const days = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
    const dayName = days[date.getDay()];
    const formatted = date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    return `${dayName}, ${formatted}`;
  }

  /**
   * Fallback response when AI is not available
   */
  private fallbackResponse(userMessage: string): AIConversationResult {
    const normalized = userMessage.toLowerCase().trim();

    // Check for commands
    if (normalized.includes('ajuda') || normalized.includes('help')) {
      return {
        responseMessage: '📋 *Como usar o LembrAI:*\n\n1. Me diga o que você quer lembrar\n2. Informe quando (data e hora)\n3. Escolha quando ser avisado\n\n*Comandos:*\n/lembretes - Ver seus lembretes\n/plano - Ver seu plano\n/cancelar - Cancelar',
        action: 'help',
      };
    }

    if (normalized.includes('lembrete') || normalized.includes('listar')) {
      return {
        responseMessage: '',
        action: 'list_reminders',
      };
    }

    if (normalized.includes('plano') || normalized.includes('uso')) {
      return {
        responseMessage: '',
        action: 'show_plan',
      };
    }

    if (normalized.includes('cancelar') || normalized.includes('cancel')) {
      return {
        responseMessage: 'Conversa cancelada. Me envie uma mensagem quando quiser criar um lembrete! 👋',
        action: 'cancel',
      };
    }

    return {
      responseMessage: '📝 Me diga o que você quer lembrar e quando! Exemplo: "Reunião amanhã às 14h"',
      action: 'none',
      needsMoreInfo: true,
    };
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}
