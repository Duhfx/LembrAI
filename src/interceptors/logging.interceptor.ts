import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

/**
 * Interceptor to log all HTTP requests and responses
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const { method, url, body, query, params } = request;
    const userAgent = request.get('user-agent') || '';
    const ip = request.ip;

    const startTime = Date.now();

    this.logger.log(
      `➡️  ${method} ${url} - ${ip} - ${userAgent}`,
    );

    // Log request details for non-GET requests
    if (method !== 'GET' && Object.keys(body || {}).length > 0) {
      this.logger.debug(`Request body: ${JSON.stringify(body)}`);
    }

    return next.handle().pipe(
      tap({
        next: (data) => {
          const responseTime = Date.now() - startTime;
          const statusCode = response.statusCode;

          this.logger.log(
            `⬅️  ${method} ${url} - ${statusCode} - ${responseTime}ms`,
          );
        },
        error: (error) => {
          const responseTime = Date.now() - startTime;
          const statusCode = error.status || 500;

          this.logger.error(
            `⬅️  ${method} ${url} - ${statusCode} - ${responseTime}ms - Error: ${error.message}`,
          );
        },
      }),
    );
  }
}
