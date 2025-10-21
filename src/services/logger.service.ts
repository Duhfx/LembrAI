import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { DatabaseService } from './database.service';

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  timestamp: Date;
  metadata?: any;
  stack?: string;
}

/**
 * Custom logger service that logs to console and optionally to database
 */
@Injectable()
export class AppLoggerService implements NestLoggerService {
  private context?: string;
  private enableDatabaseLogging: boolean = false;

  constructor(private readonly db?: DatabaseService) {
    // Database logging can be enabled later if needed
    this.enableDatabaseLogging = false;
  }

  /**
   * Set context for logger
   */
  setContext(context: string) {
    this.context = context;
  }

  /**
   * Log message
   */
  log(message: string, context?: string) {
    this.writeLog(LogLevel.INFO, message, context);
  }

  /**
   * Log error
   */
  error(message: string, trace?: string, context?: string) {
    this.writeLog(LogLevel.ERROR, message, context, { stack: trace });
  }

  /**
   * Log warning
   */
  warn(message: string, context?: string) {
    this.writeLog(LogLevel.WARN, message, context);
  }

  /**
   * Log debug
   */
  debug(message: string, context?: string) {
    this.writeLog(LogLevel.DEBUG, message, context);
  }

  /**
   * Log verbose (same as debug)
   */
  verbose(message: string, context?: string) {
    this.writeLog(LogLevel.DEBUG, message, context);
  }

  /**
   * Write log entry
   */
  private writeLog(level: LogLevel, message: string, context?: string, metadata?: any) {
    const logContext = context || this.context || 'Application';
    const timestamp = new Date();

    // Format for console
    const formattedMessage = this.formatConsoleMessage(level, message, logContext, timestamp);

    // Output to console with color
    switch (level) {
      case LogLevel.ERROR:
        console.error(formattedMessage);
        if (metadata?.stack) {
          console.error(metadata.stack);
        }
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.DEBUG:
        console.debug(formattedMessage);
        break;
      default:
        console.log(formattedMessage);
    }

    // Optionally save to database (for ERROR level)
    if (this.enableDatabaseLogging && level === LogLevel.ERROR && this.db) {
      this.saveToDatabase({
        level,
        message,
        context: logContext,
        timestamp,
        metadata,
        stack: metadata?.stack,
      }).catch(err => {
        // Fail silently if database logging fails
        console.error('Failed to save log to database:', err.message);
      });
    }
  }

  /**
   * Format message for console output
   */
  private formatConsoleMessage(level: LogLevel, message: string, context: string, timestamp: Date): string {
    const timeStr = timestamp.toISOString();
    const levelStr = level.padEnd(5, ' ');
    const contextStr = context.padEnd(20, ' ');

    return `[${timeStr}] [${levelStr}] [${contextStr}] ${message}`;
  }

  /**
   * Save log to database (optional feature)
   */
  private async saveToDatabase(entry: LogEntry): Promise<void> {
    if (!this.db) return;

    // This would save to a logs table if you create one
    // For now, we'll skip database logging to keep it simple
    // You can implement this later if needed
  }

  /**
   * Enable/disable database logging
   */
  setDatabaseLogging(enabled: boolean) {
    this.enableDatabaseLogging = enabled;
  }
}
