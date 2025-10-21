import { Injectable, Logger } from '@nestjs/common';
import { ParsedDateTime } from './parse-datetime.service';

@Injectable()
export class ParseDateTimePtService {
  private readonly logger = new Logger(ParseDateTimePtService.name);

  /**
   * Main parsing method
   */
  parseDateTime(text: string, referenceDate?: Date): ParsedDateTime {
    const ref = referenceDate || new Date();
    const normalized = this.normalizeText(text);

    this.logger.log(`📅 Parsing: "${normalized}"`);

    // Try different parsing strategies
    const result =
      this.parseRelativeDay(normalized, ref) ||
      this.parseWeekday(normalized, ref) ||
      this.parseRelativeTime(normalized, ref) ||
      this.parseSpecificTime(normalized, ref) ||
      this.parseDateTime24h(normalized, ref);

    if (result) {
      this.logger.log(`✅ Parsed: ${this.formatDate(result)}`);
      return {
        success: true,
        date: result,
        originalText: text,
        confidence: 'high',
        method: 'chrono',
        formattedDate: this.formatDate(result),
      };
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
   * Parse relative days (hoje, amanhã, depois de amanhã)
   */
  private parseRelativeDay(text: string, ref: Date): Date | null {
    const patterns: Record<string, number> = {
      'hoje': 0,
      'amanha': 1,
      'depois de amanha': 2,
      'depois': 2,
    };

    let daysToAdd: number | null = null;

    for (const [keyword, days] of Object.entries(patterns)) {
      if (text.includes(keyword)) {
        daysToAdd = days;
        break;
      }
    }

    if (daysToAdd === null) return null;

    // Extract time if present
    const time = this.extractTime(text);
    if (!time) return null;

    const result = new Date(ref);
    result.setDate(result.getDate() + daysToAdd);
    result.setHours(time.hours, time.minutes, 0, 0);

    return result;
  }

  /**
   * Parse weekdays (segunda, terça, etc)
   */
  private parseWeekday(text: string, ref: Date): Date | null {
    const weekdays = {
      'domingo': 0,
      'segunda': 1,
      'segunda-feira': 1,
      'terca': 2,
      'terca-feira': 2,
      'quarta': 3,
      'quarta-feira': 3,
      'quinta': 4,
      'quinta-feira': 4,
      'sexta': 5,
      'sexta-feira': 5,
      'sabado': 6,
    };

    let targetDay: number | null = null;

    for (const [keyword, day] of Object.entries(weekdays)) {
      if (text.includes(keyword)) {
        targetDay = day;
        break;
      }
    }

    if (targetDay === null) return null;

    // Extract time
    const time = this.extractTime(text);
    if (!time) return null;

    // Calculate days until target day
    const currentDay = ref.getDay();
    let daysUntil = targetDay - currentDay;

    if (daysUntil <= 0) {
      daysUntil += 7; // Next week
    }

    const result = new Date(ref);
    result.setDate(result.getDate() + daysUntil);
    result.setHours(time.hours, time.minutes, 0, 0);

    return result;
  }

  /**
   * Parse relative time (em 2 horas, daqui 30 minutos)
   */
  private parseRelativeTime(text: string, ref: Date): Date | null {
    // Pattern: "em X horas" or "daqui X minutos"
    const hoursMatch = text.match(/em (\d+) horas?/);
    const minutesMatch = text.match(/(?:em|daqui) (\d+) minutos?/);
    const daysMatch = text.match(/em (\d+) dias?/);

    const result = new Date(ref);

    if (hoursMatch) {
      const hours = parseInt(hoursMatch[1]);
      result.setHours(result.getHours() + hours);
      return result;
    }

    if (minutesMatch) {
      const minutes = parseInt(minutesMatch[1]);
      result.setMinutes(result.getMinutes() + minutes);
      return result;
    }

    if (daysMatch) {
      const days = parseInt(daysMatch[1]);
      result.setDate(result.getDate() + days);
      return result;
    }

    return null;
  }

  /**
   * Parse specific time without date context
   */
  private parseSpecificTime(text: string, ref: Date): Date | null {
    const time = this.extractTime(text);
    if (!time) return null;

    // Check if text has ONLY time (no date keywords)
    const hasDateKeyword = /hoje|amanha|segunda|terca|quarta|quinta|sexta|sabado|domingo/.test(text);
    if (hasDateKeyword) return null;

    const result = new Date(ref);
    result.setHours(time.hours, time.minutes, 0, 0);

    // If time is in the past, assume tomorrow
    if (result <= ref) {
      result.setDate(result.getDate() + 1);
    }

    return result;
  }

  /**
   * Parse 24h format datetime
   */
  private parseDateTime24h(text: string, ref: Date): Date | null {
    // Pattern: DD/MM HH:MM or DD/MM às HH:MM
    const match = text.match(/(\d{1,2})\/(\d{1,2})\s+(?:as\s+)?(\d{1,2}):(\d{2})/);
    if (!match) return null;

    const day = parseInt(match[1]);
    const month = parseInt(match[2]);
    const hours = parseInt(match[3]);
    const minutes = parseInt(match[4]);

    const result = new Date(ref);
    result.setMonth(month - 1);
    result.setDate(day);
    result.setHours(hours, minutes, 0, 0);

    // If date is in the past, assume next year
    if (result <= ref) {
      result.setFullYear(result.getFullYear() + 1);
    }

    return result;
  }

  /**
   * Extract time from text
   */
  private extractTime(text: string): { hours: number; minutes: number } | null {
    // Try HH:MM format
    let match = text.match(/(\d{1,2}):(\d{2})/);
    if (match) {
      return {
        hours: parseInt(match[1]),
        minutes: parseInt(match[2]),
      };
    }

    // Try HHh format
    match = text.match(/(\d{1,2})h(?:(\d{2}))?/);
    if (match) {
      return {
        hours: parseInt(match[1]),
        minutes: match[2] ? parseInt(match[2]) : 0,
      };
    }

    // Try AM/PM format
    match = text.match(/(\d{1,2})\s*(am|pm)/);
    if (match) {
      let hours = parseInt(match[1]);
      const isPM = match[2] === 'pm';

      if (isPM && hours < 12) hours += 12;
      if (!isPM && hours === 12) hours = 0;

      return { hours, minutes: 0 };
    }

    // Special cases
    if (text.includes('meio-dia') || text.includes('meio dia')) {
      return { hours: 12, minutes: 0 };
    }

    if (text.includes('meia-noite') || text.includes('meia noite')) {
      return { hours: 0, minutes: 0 };
    }

    return null;
  }

  /**
   * Normalize text
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/\u00E0/g, 'a') // à -> a
      .replace(/\u00E1/g, 'a') // á -> a
      .replace(/\u00E2/g, 'a') // â -> a
      .replace(/\u00E3/g, 'a') // ã -> a
      .replace(/\u00E9/g, 'e') // é -> e
      .replace(/\u00EA/g, 'e') // ê -> e
      .replace(/\u00ED/g, 'i') // í -> i
      .replace(/\u00F3/g, 'o') // ó -> o
      .replace(/\u00F4/g, 'o') // ô -> o
      .replace(/\u00F5/g, 'o') // õ -> o
      .replace(/\u00FA/g, 'u') // ú -> u
      .replace(/\u00E7/g, 'c'); // ç -> c
  }

  /**
   * Format date to Brazilian Portuguese
   */
  formatDate(date: Date): string {
    return date.toLocaleString('pt-BR', {
      dateStyle: 'full',
      timeStyle: 'short',
    });
  }

  /**
   * Validate date
   */
  validateDateTime(date: Date): boolean {
    const now = new Date();
    const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
    return date > now && date < oneYearFromNow;
  }
}
