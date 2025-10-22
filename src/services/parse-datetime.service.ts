import { Injectable, Logger } from '@nestjs/common';
import * as chrono from 'chrono-node';
import OpenAI from 'openai';
import { envConfig } from '../config';

export interface ParsedDateTime {
  success: boolean;
  date?: Date;
  originalText: string;
  confidence: 'high' | 'medium' | 'low';
  method: 'chrono' | 'openai' | 'failed';
  formattedDate?: string;
}

/**
 * DEPRECATED: This service is being replaced by ParseDateTimePtService + AIReminderParserService
 * Kept for backwards compatibility only
 */
@Injectable()
export class ParseDateTimeService {
  private readonly logger = new Logger(ParseDateTimeService.name);
  private readonly openai: OpenAI | null;
  private readonly customChrono: chrono.Chrono;

  constructor() {
    // Initialize OpenAI if API key is available
    if (envConfig.ai.openaiKey) {
      this.openai = new OpenAI({
        apiKey: envConfig.ai.openaiKey,
      });
      this.logger.log('✅ OpenAI initialized for date parsing fallback');
    } else {
      this.openai = null;
    }

    // Warn if no AI fallback is available
    if (!this.openai) {
      this.logger.warn('⚠️  No AI API keys found. AI fallback disabled.');
    }

    // Create custom chrono with Portuguese support
    this.customChrono = this.createPortugueseChrono();
  }

  /**
   * Create a customized chrono parser with Portuguese support
   */
  private createPortugueseChrono(): chrono.Chrono {
    const custom = chrono.casual.clone();

    // Add Portuguese day names
    const ptWeekdays = {
      domingo: 0,
      segunda: 1,
      'segunda-feira': 1,
      terça: 2,
      'terça-feira': 2,
      quarta: 3,
      'quarta-feira': 3,
      quinta: 4,
      'quinta-feira': 4,
      sexta: 5,
      'sexta-feira': 5,
      sábado: 6,
      sabado: 6,
    };

    // Add Portuguese relative terms
    const ptRelative = {
      amanhã: { days: 1 },
      amanha: { days: 1 },
      depois: { days: 2 },
      'depois de amanhã': { days: 2 },
      hoje: { days: 0 },
      ontem: { days: -1 },
    };

    return custom;
  }

  /**
   * Main method to parse date/time from text
   */
  async parseDateTime(text: string, referenceDate?: Date): Promise<ParsedDateTime> {
    const reference = referenceDate || new Date();
    const normalizedText = this.normalizeText(text);

    this.logger.log(`📅 Parsing date from: "${normalizedText}"`);

    // Try chrono-node first
    const chronoResult = this.parseWithChrono(normalizedText, reference);
    if (chronoResult.success) {
      this.logger.log(`✅ Chrono parsed successfully: ${chronoResult.formattedDate}`);
      return chronoResult;
    }

    // Fallback to AI - try OpenAI
    if (this.openai) {
      this.logger.log('🔄 Trying OpenAI fallback...');
      const openaiResult = await this.parseWithOpenAI(normalizedText, reference);
      if (openaiResult.success) {
        this.logger.log(`✅ OpenAI parsed successfully: ${openaiResult.formattedDate}`);
        return openaiResult;
      }
    }

    this.logger.warn(`❌ Failed to parse: "${text}"`);
    return {
      success: false,
      originalText: text,
      confidence: 'low',
      method: 'failed',
    };
  }

  /**
   * Parse using chrono-node
   */
  private parseWithChrono(text: string, reference: Date): ParsedDateTime {
    try {
      const results = this.customChrono.parse(text, reference);

      if (results.length === 0) {
        return {
          success: false,
          originalText: text,
          confidence: 'low',
          method: 'chrono',
        };
      }

      const result = results[0];
      const date = result.start.date();

      // Validate that the date is in the future
      if (date < reference) {
        // If date is in the past, try adding one day or week
        const adjusted = this.adjustPastDate(date, reference);
        return {
          success: true,
          date: adjusted,
          originalText: text,
          confidence: 'medium',
          method: 'chrono',
          formattedDate: this.formatDate(adjusted),
        };
      }

      return {
        success: true,
        date,
        originalText: text,
        confidence: 'high',
        method: 'chrono',
        formattedDate: this.formatDate(date),
      };
    } catch (error: any) {
      this.logger.error(`Chrono parsing error: ${error.message}`);
      return {
        success: false,
        originalText: text,
        confidence: 'low',
        method: 'chrono',
      };
    }
  }

  /**
   * Parse using OpenAI GPT-4
   */
  private async parseWithOpenAI(text: string, reference: Date): Promise<ParsedDateTime> {
    if (!this.openai) {
      return {
        success: false,
        originalText: text,
        confidence: 'low',
        method: 'openai',
      };
    }

    try {
      const prompt = `Você é um assistente especializado em extrair datas e horários de textos em português brasileiro.

Data/hora de referência: ${reference.toISOString()}
Texto: "${text}"

Extraia a data e horário do texto acima. Retorne APENAS um JSON no formato:
{
  "date": "ISO 8601 date string",
  "confidence": "high" | "medium" | "low"
}

Se não conseguir extrair, retorne:
{
  "date": null,
  "confidence": "low"
}`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 150,
      });

      const content = completion.choices[0].message.content?.trim();
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      const parsed = JSON.parse(content);

      if (!parsed.date) {
        return {
          success: false,
          originalText: text,
          confidence: 'low',
          method: 'openai',
        };
      }

      const date = new Date(parsed.date);

      // Validate date
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date from OpenAI');
      }

      return {
        success: true,
        date,
        originalText: text,
        confidence: parsed.confidence || 'medium',
        method: 'openai',
        formattedDate: this.formatDate(date),
      };
    } catch (error: any) {
      this.logger.error(`OpenAI parsing error: ${error.message}`);
      return {
        success: false,
        originalText: text,
        confidence: 'low',
        method: 'openai',
      };
    }
  }

  /**
   * Normalize text for better parsing
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .trim()
      // Replace common Portuguese variations
      .replace(/às /g, 'as ')
      .replace(/á/g, 'a')
      .replace(/é/g, 'e')
      .replace(/í/g, 'i')
      .replace(/ó/g, 'o')
      .replace(/ú/g, 'u')
      .replace(/ç/g, 'c');
  }

  /**
   * Adjust past dates to future
   */
  private adjustPastDate(date: Date, reference: Date): Date {
    const adjusted = new Date(date);

    // If only time is mentioned and it's in the past, assume tomorrow
    if (date.getDate() === reference.getDate() && date < reference) {
      adjusted.setDate(adjusted.getDate() + 1);
    }

    return adjusted;
  }

  /**
   * Format date to Brazilian Portuguese
   */
  private formatDate(date: Date): string {
    return date.toLocaleString('pt-BR', {
      dateStyle: 'full',
      timeStyle: 'short',
    });
  }

  /**
   * Validate if a date is acceptable (not too far in past/future)
   */
  validateDateTime(date: Date): boolean {
    const now = new Date();
    const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

    // Date must be in the future and within one year
    return date > now && date < oneYearFromNow;
  }

  /**
   * Format confirmation message
   */
  formatConfirmation(date: Date): string {
    return this.formatDate(date);
  }
}
