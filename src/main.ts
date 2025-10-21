import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './filters/global-exception.filter';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    const app = await NestFactory.create(AppModule, {
      logger: ['log', 'error', 'warn', 'debug', 'verbose'],
    });

    // Enable CORS
    app.enableCors();

    // Apply global exception filter
    app.useGlobalFilters(new GlobalExceptionFilter());

    // Apply global logging interceptor
    app.useGlobalInterceptors(new LoggingInterceptor());

    const port = process.env.PORT || 3000;
    await app.listen(port);

    logger.log(`🚀 LembrAI is running on: http://localhost:${port}`);
    logger.log(`📊 Admin panel: http://localhost:${port}/admin/`);
    logger.log(`📡 Webhook endpoint: http://localhost:${port}/webhook/whatsapp`);
  } catch (error: any) {
    logger.error(`❌ Failed to start application: ${error.message}`, error.stack);
    process.exit(1);
  }
}

bootstrap();
