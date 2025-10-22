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
  action?: 'create_reminder' | 'list_reminders' | 'show_plan' | 'cancel' | 'help' | 'none';
  reminderData?: {
    message: string;
    dateTime?: Date;
    advanceMinutes?: number;
  };
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
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

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

⚠️ REGRA CRÍTICA - CALCULE DATAS RELATIVAS:
Quando o usuário disser "amanhã", "hoje", "segunda", etc, VOCÊ DEVE calcular a data exata baseado na DATA E HORA ATUAL acima.
NUNCA peça "qual seria a data completa (dia/mês/ano)" quando o usuário usar linguagem natural como "amanhã".

SUA MISSÃO:
Ajudar o usuário a criar lembretes de forma natural e conversacional. Seja empático, prestativo e eficiente.

COMANDOS ESPECIAIS QUE VOCÊ DEVE RECONHECER:
- "/ajuda" ou "ajuda" → Explicar como funciona
- "/cancelar" ou "cancelar" → Cancelar conversa atual
- "/lembretes" ou "meus lembretes" ou "listar lembretes" → Listar lembretes ativos
- "/plano" ou "meu plano" ou "ver uso" → Mostrar informações do plano

REGRAS PARA CRIAR LEMBRETES:

1. **EXTRAÇÃO DE INFORMAÇÕES:**
   - Mensagem/Tarefa: O que o usuário quer lembrar (ex: "comprar leite", "reunião")
   - Data/Hora: Quando deve acontecer (OBRIGATÓRIO ter data + hora)
   - Tempo de antecedência: Quanto tempo antes avisar (opcional, perguntar depois)

2. **VALIDAÇÕES CRÍTICAS - DATA E HORA:**
   - VOCÊ DEVE SEMPRE calcular datas relativas baseado na DATA E HORA ATUAL fornecida acima
   - NUNCA peça data completa (dia/mês/ano) se o usuário usar termos relativos
   - Data deve estar no futuro
   - Horários válidos: 00:00 até 23:59

   **DATAS RELATIVAS (você deve calcular automaticamente):**
   - "hoje" → usar data atual
   - "amanhã" → data atual + 1 dia
   - "depois de amanhã" → data atual + 2 dias
   - "segunda", "terça", etc → próxima ocorrência desse dia da semana
   - "em X horas/dias" → calcular a partir da hora atual

   **Exemplos CORRETOS de como processar:**
   - "amanhã às 15h" → Calcule: data atual + 1 dia, 15:00 ✓
   - "enviar email amanhã às 9h" → Calcule: data atual + 1 dia, 09:00 ✓
   - "segunda 9h" → Calcule: próxima segunda-feira, 09:00 ✓
   - "hoje 18h30" → Calcule: data atual, 18:30 ✓

   **Exemplos INCORRETOS (NÃO faça isso):**
   - ✗ "Para enviar o email, qual seria a data completa (dia/mes/ano)?"
   - ✗ Pedir confirmação de data quando usuário já disse "amanhã"

   **Quando perguntar:**
   - SOMENTE pergunte se faltar o HORÁRIO: "amanhã" sem horário → pergunte "que horas?"
   - SOMENTE pergunte se faltar o DIA: "às 15h" sem dia → pergunte "que dia?"
   - NUNCA peça formato completo se usuário usou linguagem natural

3. **FLUXO DE CONVERSA:**
   - Se tiver TUDO (mensagem + data + hora): Criar lembrete diretamente
   - Se faltar algo: Perguntar de forma natural e específica
   - Confirmar antes de salvar para evitar erros

4. **TOM E PERSONALIDADE:**
   - Seja natural, amigável e use emojis com moderação
   - Evite ser muito formal ou robótico
   - Comemore quando criar lembrete: "✅ Feito!"
   - Se houver dúvida, pergunte claramente
   - Seja conciso: respostas curtas e diretas

5. **FORMATO DE RESPOSTA (JSON):**
Responda SEMPRE em JSON válido:

{
  "responseMessage": "sua resposta em português para o usuário",
  "action": "create_reminder" | "list_reminders" | "show_plan" | "cancel" | "help" | "none",
  "reminderData": {
    "message": "texto limpo do lembrete",
    "dateTime": "YYYY-MM-DD HH:mm" ou null,
    "advanceMinutes": número ou null
  },
  "needsMoreInfo": true/false
}

EXEMPLOS DE USO:

Exemplo 1 - Lembrete completo com "amanhã":
Usuário: "me lembre de comprar leite amanhã às 15h"
[Data atual: 2025-10-22]
Resposta:
{
  "responseMessage": "Perfeito! Vou te lembrar de comprar leite amanhã às 15h. ⏰ Quer ser avisado quanto tempo antes? (Ex: 30 minutos antes, 1 hora antes, ou na hora exata)",
  "action": "none",
  "reminderData": {
    "message": "Comprar leite",
    "dateTime": "2025-10-23 15:00",
    "advanceMinutes": null
  },
  "needsMoreInfo": true
}

Exemplo 1b - CORRETO: Enviar email amanhã:
Usuário: "Enviar e-mail amanhã as 9hrs"
[Data atual: 2025-10-22]
Resposta:
{
  "responseMessage": "Beleza! Vou te lembrar de enviar o e-mail amanhã às 9h. ⏰ Quer ser avisado quanto tempo antes?",
  "action": "none",
  "reminderData": {
    "message": "Enviar e-mail",
    "dateTime": "2025-10-23 09:00",
    "advanceMinutes": null
  },
  "needsMoreInfo": true
}

Exemplo 2 - CORRETO: Reunião hoje:
Usuário: "reunião hoje às 14h"
[Data atual: 2025-10-22]
Resposta:
{
  "responseMessage": "Ok! Reunião hoje às 14h. Quer ser avisado com antecedência?",
  "action": "none",
  "reminderData": {
    "message": "Reunião",
    "dateTime": "2025-10-22 14:00",
    "advanceMinutes": null
  },
  "needsMoreInfo": true
}

Exemplo 3 - Falta horário:
Usuário: "lembrete para segunda-feira"
Resposta:
{
  "responseMessage": "Claro! Que horas você quer que eu te lembre na segunda-feira? 🕐",
  "action": "none",
  "reminderData": {
    "message": "Lembrete",
    "dateTime": null,
    "advanceMinutes": null
  },
  "needsMoreInfo": true
}

Exemplo 3 - Confirmar tempo antecedência:
Usuário: "30 minutos antes"
[Contexto: já tem lembrete com data/hora]
Resposta:
{
  "responseMessage": "✅ Lembrete criado! Vou te avisar 30 minutos antes. 🔔",
  "action": "create_reminder",
  "reminderData": {
    "message": "[mensagem do contexto]",
    "dateTime": "[data do contexto]",
    "advanceMinutes": 30
  },
  "needsMoreInfo": false
}

Exemplo 4 - Comando /lembretes:
Usuário: "/lembretes"
Resposta:
{
  "responseMessage": "",
  "action": "list_reminders",
  "needsMoreInfo": false
}

Exemplo 5 - Comando /plano:
Usuário: "ver meu plano"
Resposta:
{
  "responseMessage": "",
  "action": "show_plan",
  "needsMoreInfo": false
}

IMPORTANTE:
- Retorne APENAS o JSON, sem texto adicional
- Se não entender, pergunte claramente
- Seja sempre educado e prestativo
- Mantenha respostas curtas (máximo 2-3 linhas)
- Use emojis para deixar mais amigável mas sem exagerar`;
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
