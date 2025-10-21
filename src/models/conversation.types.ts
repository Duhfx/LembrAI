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
 * Conversation Context
 */
export interface ConversationContext {
  userId: string;
  phone: string;
  state: ConversationState;
  reminderMessage?: string;
  parsedDateTime?: Date;
  advanceMinutes?: number;
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
