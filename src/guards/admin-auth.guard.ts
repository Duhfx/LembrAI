import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Guard para autenticação HTTP Basic no painel admin
 * Usa credenciais definidas no .env (ADMIN_USERNAME e ADMIN_PASSWORD)
 */
@Injectable()
export class AdminAuthGuard implements CanActivate {
  private readonly logger = new Logger(AdminAuthGuard.name);
  private readonly adminUsername = process.env.ADMIN_USERNAME || 'admin';
  private readonly adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    // Extrair credenciais do header Authorization
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      this.requestAuth(response);
      return false;
    }

    try {
      // Decodificar credenciais Base64
      const base64Credentials = authHeader.substring(6);
      const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
      const [username, password] = credentials.split(':');

      // Validar credenciais
      if (username === this.adminUsername && password === this.adminPassword) {
        this.logger.log(`✅ Admin authenticated: ${username}`);
        return true;
      }

      this.logger.warn(`❌ Failed authentication attempt for user: ${username}`);
      this.requestAuth(response);
      return false;
    } catch (error) {
      this.logger.error('❌ Error parsing authorization header', error);
      this.requestAuth(response);
      return false;
    }
  }

  private requestAuth(response: Response): void {
    response.setHeader('WWW-Authenticate', 'Basic realm="LembrAI Admin Panel"');
    throw new UnauthorizedException('Autenticação necessária');
  }
}
