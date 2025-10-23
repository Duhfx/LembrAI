/**
 * Conversation States
 */
export enum ConversationState {
  INITIAL = 'INITIAL',
  WAITING_DATETIME = 'WAITING_DATETIME',
  WAITING_ADVANCE_TIME = 'WAITING_ADVANCE_TIME',
  CONFIRMING = 'CONFIRMING',
  CONFIRMING_DELETE = 'CONFIRMING_DELETE',
  SELECTING_REMINDER_TO_DELETE = 'SELECTING_REMINDER_TO_DELETE',
}

/**
 * Conversation Message for AI history
 */
export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

/**
 * Reminder to delete (for selection)
 */
export interface ReminderOption {
  id: string;
  message: string;
  datetime: Date;
}

/**
 * Conversation Context
 */
export interface ConversationContext {
  userId: string;
  phone: string;
  state: ConversationState;
  reminderMessage?: string;
  parsedDateTime?: Date;
  advanceMinutes?: number;
  messageHistory?: ConversationMessage[];
  // Delete reminder context
  pendingDeleteReminderId?: string;
  deleteReminderOptions?: ReminderOption[];
  deleteKeyword?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Message Handler Response
 */
export interface HandlerResponse {
  message: string;
  nextState: ConversationState;
  shouldSave?: boolean;
}
