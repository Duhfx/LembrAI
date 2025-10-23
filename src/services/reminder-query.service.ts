import { Injectable, Logger } from '@nestjs/common';
import { Reminder } from '../../generated/prisma';

export interface PeriodDates {
  startDate: Date;
  endDate: Date;
  label: string;
}

export interface FormattedReminder {
  time: string;
  message: string;
  dateTime: Date;
}

export interface RemindersByDay {
  date: string;
  dayLabel: string;
  reminders: FormattedReminder[];
}

/**
 * Service for querying and formatting reminders based on natural language periods
 */
@Injectable()
export class ReminderQueryService {
  private readonly logger = new Logger(ReminderQueryService.name);

  /**
   * Parse natural language period into date range
   */
  parsePeriod(period: string): PeriodDates {
    const now = new Date();
    const normalizedPeriod = period.toLowerCase().trim();

    this.logger.log(`📅 Parsing period: "${normalizedPeriod}"`);

    // Hoje
    if (normalizedPeriod.includes('hoje')) {
      const startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
      return { startDate, endDate, label: 'hoje' };
    }

    // Amanhã
    if (normalizedPeriod.includes('amanhã') || normalizedPeriod.includes('amanha')) {
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() + 1);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(startDate);
      endDate.setHours(23, 59, 59, 999);
      return { startDate, endDate, label: 'amanhã' };
    }

    // Depois de amanhã
    if (normalizedPeriod.includes('depois de amanhã') || normalizedPeriod.includes('depois de amanha')) {
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() + 2);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(startDate);
      endDate.setHours(23, 59, 59, 999);
      return { startDate, endDate, label: 'depois de amanhã' };
    }

    // Esta semana / essa semana
    if (normalizedPeriod.includes('esta semana') || normalizedPeriod.includes('essa semana')) {
      const startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(now);
      // Próximo domingo
      const daysUntilSunday = 7 - endDate.getDay();
      endDate.setDate(endDate.getDate() + daysUntilSunday);
      endDate.setHours(23, 59, 59, 999);
      return { startDate, endDate, label: 'esta semana' };
    }

    // Próxima semana
    if (normalizedPeriod.includes('próxima semana') || normalizedPeriod.includes('proxima semana')) {
      const startDate = new Date(now);
      // Próxima segunda-feira
      const daysUntilNextMonday = (8 - startDate.getDay()) % 7 || 7;
      startDate.setDate(startDate.getDate() + daysUntilNextMonday);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      return { startDate, endDate, label: 'próxima semana' };
    }

    // Este mês / esse mês
    if (normalizedPeriod.includes('este mês') || normalizedPeriod.includes('esse mês') ||
        normalizedPeriod.includes('este mes') || normalizedPeriod.includes('esse mes')) {
      const startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
      return { startDate, endDate, label: 'este mês' };
    }

    // Próximo mês
    if (normalizedPeriod.includes('próximo mês') || normalizedPeriod.includes('proximo mês') ||
        normalizedPeriod.includes('próximo mes') || normalizedPeriod.includes('proximo mes')) {
      const startDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(now.getFullYear(), now.getMonth() + 2, 0);
      endDate.setHours(23, 59, 59, 999);
      return { startDate, endDate, label: 'próximo mês' };
    }

    // Dias da semana
    const weekdays = {
      'segunda': 1,
      'terça': 2,
      'terca': 2,
      'quarta': 3,
      'quinta': 4,
      'sexta': 5,
      'sábado': 6,
      'sabado': 6,
      'domingo': 0,
    };

    for (const [dayName, dayIndex] of Object.entries(weekdays)) {
      if (normalizedPeriod.includes(dayName)) {
        const startDate = new Date(now);
        const currentDay = startDate.getDay();
        let daysToAdd = dayIndex - currentDay;
        if (daysToAdd <= 0) daysToAdd += 7; // Próxima ocorrência
        startDate.setDate(startDate.getDate() + daysToAdd);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
        return { startDate, endDate, label: dayName };
      }
    }

    // Próximos X dias
    const nextDaysMatch = normalizedPeriod.match(/próximos?\s+(\d+)\s+dias?|proximos?\s+(\d+)\s+dias?/);
    if (nextDaysMatch) {
      const days = parseInt(nextDaysMatch[1] || nextDaysMatch[2]);
      const startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + days - 1);
      endDate.setHours(23, 59, 59, 999);
      return { startDate, endDate, label: `próximos ${days} dias` };
    }

    // Default: próximos 7 dias
    this.logger.warn(`⚠️ Period not recognized: "${normalizedPeriod}", using default (7 days)`);
    const startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);
    return { startDate, endDate, label: 'próximos 7 dias' };
  }

  /**
   * Format reminders list into a user-friendly message
   */
  formatRemindersList(reminders: Reminder[], periodLabel: string): string {
    if (reminders.length === 0) {
      return `Você não tem lembretes para ${periodLabel}. 📅`;
    }

    // Group reminders by day
    const remindersByDay = this.groupRemindersByDay(reminders);

    // Build message
    let message = `📋 *Seus lembretes para ${periodLabel}:*\n\n`;

    remindersByDay.forEach((day, index) => {
      // Add day header (only if multiple days)
      if (remindersByDay.length > 1) {
        message += `*${day.dayLabel}*\n`;
      }

      // Add reminders for this day
      day.reminders.forEach((reminder, reminderIndex) => {
        const number = remindersByDay.length > 1 ? reminderIndex + 1 : index + reminderIndex + 1;
        message += `${number}. ⏰ ${reminder.time} - ${reminder.message}\n`;
      });

      // Add spacing between days
      if (index < remindersByDay.length - 1) {
        message += '\n';
      }
    });

    // Add total count
    const total = reminders.length;
    message += `\n_Total: ${total} ${total === 1 ? 'lembrete' : 'lembretes'}_`;

    return message;
  }

  /**
   * Group reminders by day
   */
  private groupRemindersByDay(reminders: Reminder[]): RemindersByDay[] {
    const grouped = new Map<string, FormattedReminder[]>();

    reminders.forEach(reminder => {
      const dateKey = this.formatDateKey(reminder.reminderDatetime);
      const formattedReminder: FormattedReminder = {
        time: this.formatTime(reminder.reminderDatetime),
        message: reminder.message,
        dateTime: reminder.reminderDatetime,
      };

      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(formattedReminder);
    });

    // Convert to array and sort by date
    const result: RemindersByDay[] = [];
    const sortedKeys = Array.from(grouped.keys()).sort();

    sortedKeys.forEach(dateKey => {
      const remindersForDay = grouped.get(dateKey)!;
      // Sort reminders within the day by time
      remindersForDay.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());

      result.push({
        date: dateKey,
        dayLabel: this.formatDayLabel(remindersForDay[0].dateTime),
        reminders: remindersForDay,
      });
    });

    return result;
  }

  /**
   * Format date as key for grouping (YYYY-MM-DD)
   */
  private formatDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Format time as HH:mm
   */
  private formatTime(date: Date): string {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /**
   * Format day label (e.g., "Hoje (22/10)", "Segunda (23/10)")
   */
  private formatDayLabel(date: Date): string {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.floor((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    const weekdays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const dayName = weekdays[date.getDay()];
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');

    if (diffDays === 0) {
      return `Hoje (${day}/${month})`;
    } else if (diffDays === 1) {
      return `Amanhã (${day}/${month})`;
    } else if (diffDays === 2) {
      return `Depois de amanhã (${day}/${month})`;
    } else if (diffDays <= 7) {
      return `${dayName} (${day}/${month})`;
    } else {
      return `${dayName}, ${day}/${month}`;
    }
  }
}
