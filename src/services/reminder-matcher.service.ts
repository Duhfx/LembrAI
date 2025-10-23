import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { envConfig } from '../config/env.config';
import { Reminder } from '../../generated/prisma';

export interface MatchResult {
  matchedReminderIds: string[];
  confidence: 'high' | 'medium' | 'low';
}

/**
 * AI-powered reminder matching service
 * Uses Gemini to intelligently match user keywords with reminders
 */
@Injectable()
export class ReminderMatcherService {
  private readonly logger = new Logger(ReminderMatcherService.name);
  private readonly genAI: GoogleGenerativeAI | null = null;
  private readonly enabled: boolean;

  constructor() {
    if (envConfig.ai.geminiKey) {
      this.genAI = new GoogleGenerativeAI(envConfig.ai.geminiKey);
      this.enabled = true;
      this.logger.log('✅ Reminder Matcher Service enabled (Gemini AI)');
    } else {
      this.enabled = false;
      this.logger.warn('⚠️  Reminder Matcher Service disabled (no GEMINI_API_KEY)');
    }
  }

  /**
   * Match reminders with user keyword using AI
   */
  async matchReminders(reminders: Reminder[], keyword: string): Promise<MatchResult> {
    if (!this.enabled || !this.genAI || reminders.length === 0) {
      return this.fallbackMatch(reminders, keyword);
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

      const prompt = this.buildMatchingPrompt(reminders, keyword);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      this.logger.log(`🤖 AI Matching response: ${text.substring(0, 100)}...`);

      return this.parseMatchingResponse(text, reminders);
    } catch (error: any) {
      this.logger.error(`❌ AI matching error: ${error.message}`);
      return this.fallbackMatch(reminders, keyword);
    }
  }

  /**
   * Build prompt for AI matching
   */
  private buildMatchingPrompt(reminders: Reminder[], keyword: string): string {
    const remindersList = reminders.map((r, index) =>
      `${index + 1}. "${r.message}" (ID: ${r.id})`
    ).join('\n');

    return `Você é um assistente especializado em identificar correspondências entre palavras-chave e lembretes.

PALAVRA-CHAVE DO USUÁRIO:
"${keyword}"

LEMBRETES DISPONÍVEIS:
${remindersList}

TAREFA:
Identifique quais lembretes correspondem à palavra-chave do usuário.

REGRAS:
- Ignore artigos (o, a, da, do, de, para, com, etc)
- Considere sinônimos e variações (reunião = meeting, café = coffee)
- Busque correspondência semântica, não apenas literal
- Seja flexível com plural/singular
- Considere palavras parciais

EXEMPLOS:
- Keyword: "reunião" → Match: "Reunião com cliente", "Reunião de equipe"
- Keyword: "da reunião" → Match: "Reunião com cliente", "Reunião de equipe"
- Keyword: "café" → Match: "Comprar café", "Café com João"
- Keyword: "ligar médico" → Match: "Ligar para o médico"
- Keyword: "compras" → Match: "Comprar leite", "Ir ao mercado"

FORMATO DE RESPOSTA (JSON):
{
  "matchedIds": ["id1", "id2"],
  "confidence": "high" | "medium" | "low",
  "reasoning": "breve explicação do match"
}

Se nenhum lembrete corresponder, retorne:
{
  "matchedIds": [],
  "confidence": "high",
  "reasoning": "nenhuma correspondência encontrada"
}

Responda APENAS com o JSON, sem texto adicional.`;
  }

  /**
   * Parse AI matching response
   */
  private parseMatchingResponse(aiResponse: string, reminders: Reminder[]): MatchResult {
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate matched IDs exist in reminders
      const validIds = parsed.matchedIds.filter((id: string) =>
        reminders.some(r => r.id === id)
      );

      return {
        matchedReminderIds: validIds,
        confidence: parsed.confidence || 'medium',
      };
    } catch (error: any) {
      this.logger.error(`Failed to parse AI matching response: ${error.message}`);
      return {
        matchedReminderIds: [],
        confidence: 'low',
      };
    }
  }

  /**
   * Fallback matching (simple keyword search)
   */
  private fallbackMatch(reminders: Reminder[], keyword: string): MatchResult {
    const normalizedKeyword = keyword.toLowerCase().trim();

    const matched = reminders.filter(r =>
      r.message.toLowerCase().includes(normalizedKeyword)
    );

    return {
      matchedReminderIds: matched.map(r => r.id),
      confidence: 'medium',
    };
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}
