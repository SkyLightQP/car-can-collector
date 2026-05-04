import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = (request.headers as unknown as Record<string, string>)['x-api-key'];

    if (!apiKey || apiKey !== this.config.getOrThrow<string>('API_KEY')) {
      throw new UnauthorizedException('Invalid API key');
    }

    return true;
  }
}
