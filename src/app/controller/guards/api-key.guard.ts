import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { ApiKeyService } from '@app/service/api-key.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.header('x-api-key');

    if (!(await this.apiKeyService.isValid(apiKey))) {
      throw new UnauthorizedException('Invalid API key');
    }

    return true;
  }
}
