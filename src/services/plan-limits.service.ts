import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { PlanType } from '../../generated/prisma';

/**
 * Plan limits configuration
 */
export const PLAN_LIMITS = {
  FREE: {
    maxRemindersPerMonth: 10,
    maxActiveReminders: 5,
    maxAdvanceTime: 60, // minutes
    features: {
      whatsappNotifications: true,
      emailNotifications: false,
      recurringReminders: false,
      prioritySupport: false,
    },
  },
  PAID: {
    maxRemindersPerMonth: -1, // unlimited
    maxActiveReminders: -1, // unlimited
    maxAdvanceTime: -1, // unlimited
    features: {
      whatsappNotifications: true,
      emailNotifications: true,
      recurringReminders: true,
      prioritySupport: true,
    },
  },
};

export interface UsageStats {
  remindersThisMonth: number;
  activeReminders: number;
  planType: PlanType;
  limits: {
    maxRemindersPerMonth: number;
    maxActiveReminders: number;
    maxAdvanceTime: number;
  };
  canCreateReminder: boolean;
  reasonIfCannot?: string;
}

@Injectable()
export class PlanLimitsService {
  private readonly logger = new Logger(PlanLimitsService.name);

  constructor(private readonly db: DatabaseService) {}

  /**
   * Check if user can create a new reminder
   */
  async canCreateReminder(userId: string): Promise<{ allowed: boolean; reason?: string }> {
    const user = await this.db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { allowed: false, reason: 'Usuário não encontrado' };
    }

    const limits = PLAN_LIMITS[user.planType];

    // Check active reminders limit
    if (limits.maxActiveReminders !== -1) {
      const activeCount = await this.db.reminder.count({
        where: {
          userId,
          status: 'PENDING',
        },
      });

      if (activeCount >= limits.maxActiveReminders) {
        return {
          allowed: false,
          reason: `Você atingiu o limite de ${limits.maxActiveReminders} lembretes ativos no plano ${user.planType}. Aguarde o envio dos lembretes existentes ou faça upgrade para o plano PAID.`,
        };
      }
    }

    // Check monthly reminders limit
    if (limits.maxRemindersPerMonth !== -1) {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const monthlyCount = await this.db.reminder.count({
        where: {
          userId,
          createdAt: {
            gte: startOfMonth,
          },
        },
      });

      if (monthlyCount >= limits.maxRemindersPerMonth) {
        return {
          allowed: false,
          reason: `Você atingiu o limite de ${limits.maxRemindersPerMonth} lembretes por mês no plano ${user.planType}. Aguarde o próximo mês ou faça upgrade para o plano PAID.`,
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Validate advance time based on plan
   */
  async validateAdvanceTime(userId: string, advanceMinutes: number): Promise<{ valid: boolean; reason?: string }> {
    const user = await this.db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { valid: false, reason: 'Usuário não encontrado' };
    }

    const limits = PLAN_LIMITS[user.planType];

    if (limits.maxAdvanceTime !== -1 && advanceMinutes > limits.maxAdvanceTime) {
      return {
        valid: false,
        reason: `O plano ${user.planType} permite avisos com no máximo ${limits.maxAdvanceTime} minutos de antecedência. Faça upgrade para o plano PAID para avisos ilimitados.`,
      };
    }

    return { valid: true };
  }

  /**
   * Get user usage statistics
   */
  async getUserUsage(userId: string): Promise<UsageStats | null> {
    const user = await this.db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return null;
    }

    const limits = PLAN_LIMITS[user.planType];

    // Count active reminders
    const activeReminders = await this.db.reminder.count({
      where: {
        userId,
        status: 'PENDING',
      },
    });

    // Count reminders this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const remindersThisMonth = await this.db.reminder.count({
      where: {
        userId,
        createdAt: {
          gte: startOfMonth,
        },
      },
    });

    // Check if can create reminder
    const canCreate = await this.canCreateReminder(userId);

    return {
      remindersThisMonth,
      activeReminders,
      planType: user.planType,
      limits: {
        maxRemindersPerMonth: limits.maxRemindersPerMonth,
        maxActiveReminders: limits.maxActiveReminders,
        maxAdvanceTime: limits.maxAdvanceTime,
      },
      canCreateReminder: canCreate.allowed,
      reasonIfCannot: canCreate.reason,
    };
  }

  /**
   * Check if user has access to a feature
   */
  async hasFeatureAccess(userId: string, feature: keyof typeof PLAN_LIMITS.FREE.features): Promise<boolean> {
    const user = await this.db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return false;
    }

    return PLAN_LIMITS[user.planType].features[feature];
  }

  /**
   * Get plan information for display
   */
  getPlanInfo(planType: PlanType) {
    return PLAN_LIMITS[planType];
  }

  /**
   * Format usage message for WhatsApp
   */
  async formatUsageMessage(userId: string): Promise<string> {
    const usage = await this.getUserUsage(userId);

    if (!usage) {
      return '❌ Erro ao obter informações de uso.';
    }

    const limits = usage.limits;
    const planEmoji = usage.planType === 'FREE' ? '🆓' : '💎';

    let message = `${planEmoji} *Seu Plano: ${usage.planType}*\n\n`;

    // Reminders this month
    if (limits.maxRemindersPerMonth === -1) {
      message += `📊 Lembretes este mês: ${usage.remindersThisMonth} (ilimitado)\n`;
    } else {
      message += `📊 Lembretes este mês: ${usage.remindersThisMonth}/${limits.maxRemindersPerMonth}\n`;
    }

    // Active reminders
    if (limits.maxActiveReminders === -1) {
      message += `⏳ Lembretes ativos: ${usage.activeReminders} (ilimitado)\n`;
    } else {
      message += `⏳ Lembretes ativos: ${usage.activeReminders}/${limits.maxActiveReminders}\n`;
    }

    // Advance time limit
    if (limits.maxAdvanceTime === -1) {
      message += `⏰ Tempo de antecedência: ilimitado\n`;
    } else {
      message += `⏰ Tempo de antecedência: até ${limits.maxAdvanceTime} minutos\n`;
    }

    // Warning if close to limits
    if (limits.maxRemindersPerMonth !== -1) {
      const percentUsed = (usage.remindersThisMonth / limits.maxRemindersPerMonth) * 100;
      if (percentUsed >= 80) {
        message += `\n⚠️ Você já usou ${percentUsed.toFixed(0)}% do seu limite mensal!`;
      }
    }

    // Upgrade suggestion
    if (usage.planType === 'FREE') {
      message += `\n\n💎 *Faça upgrade para PAID e tenha:*\n`;
      message += `• Lembretes ilimitados\n`;
      message += `• Sem limite de tempo de antecedência\n`;
      message += `• Notificações por email\n`;
      message += `• Suporte prioritário`;
    }

    return message;
  }
}
