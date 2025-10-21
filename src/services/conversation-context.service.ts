import { Injectable, Logger } from '@nestjs/common';
import { ConversationContext, ConversationState } from '../models';

/**
 * Service to manage conversation contexts
 * In production, this should use Redis for distributed caching
 * For now, using in-memory storage
 */
@Injectable()
export class ConversationContextService {
  private readonly logger = new Logger(ConversationContextService.name);
  private readonly contexts = new Map<string, ConversationContext>();
  private readonly CONTEXT_TIMEOUT = 10 * 60 * 1000; // 10 minutes

  /**
   * Get or create context for a user
   */
  getOrCreateContext(phone: string): ConversationContext {
    const existing = this.contexts.get(phone);

    // Check if context exists and is not expired
    if (existing) {
      const now = new Date();
      const elapsed = now.getTime() - existing.updatedAt.getTime();

      if (elapsed < this.CONTEXT_TIMEOUT) {
        this.logger.debug(`Retrieved existing context for ${phone}, state: ${existing.state}`);
        return existing;
      } else {
        this.logger.debug(`Context expired for ${phone}, creating new one`);
      }
    }

    // Create new context
    const context: ConversationContext = {
      userId: '', // Will be set when user is found/created
      phone,
      state: ConversationState.INITIAL,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.contexts.set(phone, context);
    this.logger.log(`Created new context for ${phone}`);

    return context;
  }

  /**
   * Update context
   */
  updateContext(phone: string, updates: Partial<ConversationContext>): ConversationContext {
    const context = this.getOrCreateContext(phone);

    const updated: ConversationContext = {
      ...context,
      ...updates,
      updatedAt: new Date(),
    };

    this.contexts.set(phone, updated);
    this.logger.debug(`Updated context for ${phone}: ${JSON.stringify(updates)}`);

    return updated;
  }

  /**
   * Clear context for a user
   */
  clearContext(phone: string): void {
    this.contexts.delete(phone);
    this.logger.log(`Cleared context for ${phone}`);
  }

  /**
   * Get current state
   */
  getState(phone: string): ConversationState {
    const context = this.getOrCreateContext(phone);
    return context.state;
  }

  /**
   * Set state
   */
  setState(phone: string, state: ConversationState): void {
    this.updateContext(phone, { state });
  }

  /**
   * Cleanup expired contexts (should be called periodically)
   */
  cleanupExpiredContexts(): void {
    const now = new Date();
    let cleaned = 0;

    for (const [phone, context] of this.contexts.entries()) {
      const elapsed = now.getTime() - context.updatedAt.getTime();
      if (elapsed >= this.CONTEXT_TIMEOUT) {
        this.contexts.delete(phone);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.log(`Cleaned up ${cleaned} expired contexts`);
    }
  }
}
