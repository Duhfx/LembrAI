import { Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { envConfig } from '../config/env.config';
import { ParseDateTimePtService } from './parse-datetime-pt.service';

export interface AIParseResult {
  success: boolean;
  cleanedMessage: string;
  dateTime?: Date;
  confidence: 'high' | 'medium' | 'low';
  method: 'ai' | 'offline' | 'failed';
  error?: string;
}

/**
 * AI-powered reminder parser using Claude API
 * Extracts cleaned reminder message and datetime from user input
 */
@Injectable()
export class AIReminderParserService {
  private readonly logger = new Logger(AIReminderParserService.name);
  private readonly client: Anthropic | null = null;
  private readonly enabled: boolean;

  constructor(private readonly offlineParser: ParseDateTimePtService) {
    // Initialize Claude client if API key is available
    if (envConfig.ai.anthropicKey) {
      this.client = new Anthropic({
        apiKey: envConfig.ai.anthropicKey,
      });
      this.enabled = true;
      this.logger.log('✅ AI Parser enabled (Claude API)');
    } else {
      this.enabled = false;
      this.logger.warn('⚠️  AI Parser disabled (no ANTHROPIC_API_KEY)');
    }
  }

  /**
   * Parse reminder using AI (with offline fallback)
   */
  async parseReminder(userMessage: string): Promise<AIParseResult> {
    // If AI is not enabled, use offline parser immediately
    if (!this.enabled || !this.client) {
      return this.fallbackToOfflineParser(userMessage);
    }

    try {
      this.logger.log(`🤖 Parsing with AI: "${userMessage}"`);

      const response = await this.client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        temperature: 0,
        messages: [
          {
            role: 'user',
            content: this.buildPrompt(userMessage),
          },
        ],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      const result = this.parseAIResponse(content.text, userMessage);

      if (result.success) {
        this.logger.log(`✅ AI parsed successfully: "${result.cleanedMessage}"`);
        return result;
      } else {
        this.logger.warn(`⚠️  AI parsing failed, using fallback`);
        return this.fallbackToOfflineParser(userMessage);
      }
    } catch (error: any) {
      this.logger.error(`❌ AI parsing error: ${error.message}`);
      return this.fallbackToOfflineParser(userMessage);
    }
  }

  /**
   * Build prompt for Claude API
   */
  private buildPrompt(userMessage: string): string {
    const now = new Date();
    const currentDateTime = this.formatCurrentDateTime(now);

    return `Você é um assistente especializado em extrair lembretes de mensagens em português do Brasil.

DATA E HORA ATUAL: ${currentDateTime}

MENSAGEM DO USUÁRIO:
"${userMessage}"

TAREFA:
Extraia desta mensagem:
1. O TEXTO LIMPO do lembrete (removendo todas as referências de tempo)
2. A DATA E HORA do lembrete (se houver)

INSTRUÇÕES IMPORTANTES:
- Remova da mensagem TUDO relacionado a tempo: "umas", "às", horários, dias da semana, "amanhã", "hoje", etc.
- O texto limpo deve ser APENAS a ação/tarefa do lembrete
- Seja conciso e objetivo no texto limpo
- Se houver data/hora, calcule corretamente baseado na data atual
- Dias da semana referem-se à próxima ocorrência

FORMATO DE RESPOSTA (JSON):
{
  "cleanedMessage": "texto limpo do lembrete sem referências de tempo",
  "hasDateTime": true/false,
  "dateTime": "YYYY-MM-DD HH:mm" (ou null se não houver),
  "confidence": "high/medium/low"
}

EXEMPLOS:

Entrada: "me lembre umas 9:00 de ligar para o cliente"
Saída: {"cleanedMessage": "Ligar para o cliente", "hasDateTime": true, "dateTime": "2025-10-22 09:00", "confidence": "high"}

Entrada: "comprar leite amanhã às 15h"
Saída: {"cleanedMessage": "Comprar leite", "hasDateTime": true, "dateTime": "2025-10-22 15:00", "confidence": "high"}

Entrada: "reunião importante"
Saída: {"cleanedMessage": "Reunião importante", "hasDateTime": false, "dateTime": null, "confidence": "high"}

Entrada: "ligar pro João segunda 10h"
Saída: {"cleanedMessage": "Ligar pro João", "hasDateTime": true, "dateTime": "2025-10-27 10:00", "confidence": "high"}

Responda APENAS com o JSON, sem texto adicional.`;
  }

  /**
   * Parse AI response JSON
   */
  private parseAIResponse(aiResponse: string, originalMessage: string): AIParseResult {
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate response structure
      if (!parsed.cleanedMessage || typeof parsed.hasDateTime !== 'boolean') {
        throw new Error('Invalid AI response structure');
      }

      let dateTime: Date | undefined;

      if (parsed.hasDateTime && parsed.dateTime) {
        // Parse datetime string "YYYY-MM-DD HH:mm"
        dateTime = this.parseDateTimeString(parsed.dateTime);

        if (!dateTime || !this.offlineParser.validateDateTime(dateTime)) {
          this.logger.warn(`Invalid datetime from AI: ${parsed.dateTime}`);
          dateTime = undefined;
        }
      }

      return {
        success: true,
        cleanedMessage: parsed.cleanedMessage,
        dateTime,
        confidence: parsed.confidence || 'medium',
        method: 'ai',
      };
    } catch (error: any) {
      this.logger.error(`Failed to parse AI response: ${error.message}`);
      return {
        success: false,
        cleanedMessage: originalMessage,
        confidence: 'low',
        method: 'failed',
        error: error.message,
      };
    }
  }

  /**
   * Parse datetime string in format "YYYY-MM-DD HH:mm"
   */
  private parseDateTimeString(dateTimeStr: string): Date | undefined {
    try {
      // Expected format: "2025-10-22 09:00"
      const match = dateTimeStr.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})$/);
      if (!match) {
        return undefined;
      }

      const [, year, month, day, hours, minutes] = match;
      const date = new Date(
        parseInt(year),
        parseInt(month) - 1, // JS months are 0-indexed
        parseInt(day),
        parseInt(hours),
        parseInt(minutes),
        0,
        0
      );

      // Validate date is valid
      if (isNaN(date.getTime())) {
        return undefined;
      }

      return date;
    } catch {
      return undefined;
    }
  }

  /**
   * Format current datetime for prompt context
   */
  private formatCurrentDateTime(date: Date): string {
    const days = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
    const dayName = days[date.getDay()];

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${dayName}, ${day}/${month}/${year} às ${hours}:${minutes}`;
  }

  /**
   * Fallback to offline parser
   */
  private fallbackToOfflineParser(userMessage: string): AIParseResult {
    this.logger.log(`📊 Using offline parser for: "${userMessage}"`);

    const parsed = this.offlineParser.parseDateTime(userMessage);

    if (parsed.success && parsed.date) {
      // Try to extract cleaned message using regex (current method)
      const cleanedMessage = this.extractReminderTextSimple(userMessage);

      return {
        success: true,
        cleanedMessage,
        dateTime: parsed.date,
        confidence: 'medium',
        method: 'offline',
      };
    }

    // No datetime found
    return {
      success: true,
      cleanedMessage: userMessage,
      dateTime: undefined,
      confidence: 'low',
      method: 'offline',
    };
  }

  /**
   * Simple regex-based text extraction (fallback method)
   */
  private extractReminderTextSimple(message: string): string {
    let text = message;

    // Remove common date/time patterns
    const patterns = [
      /\s+(amanhã|amanha)\s+(às|as|a)?\s*\d{1,2}(h|:?\d{2})?/gi,
      /\s+(hoje)\s+(às|as|a)?\s*\d{1,2}(h|:?\d{2})?/gi,
      /\s+(segunda|terca|terça|quarta|quinta|sexta|sabado|sábado|domingo)(-feira)?\s+(às|as|a)?\s*\d{1,2}(h|:?\d{2})?/gi,
      /\s+em\s+\d+\s+(minutos?|horas?|dias?)/gi,
      /\s+(às|as|a|umas)\s*\d{1,2}(h|:?\d{2})?/gi,
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
   * Check if AI parser is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}
