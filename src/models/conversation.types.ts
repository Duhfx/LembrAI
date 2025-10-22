/**
 * Conversation States
 */
export enum ConversationState {
  INITIAL = 'INITIAL',
  WAITING_DATETIME = 'WAITING_DATETIME',
  WAITING_ADVANCE_TIME = 'WAITING_ADVANCE_TIME',
  CONFIRMING = 'CONFIRMING',
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
