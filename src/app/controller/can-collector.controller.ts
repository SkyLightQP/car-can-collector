import { BadRequestException, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ApiKeyGuard } from './guards/api-key.guard';
import { CanCollectorService } from '@app/service/can-collector.service';

const FRAME_SIZE = 13;

@Controller('can-collector')
@UseGuards(ApiKeyGuard)
export class CanCollectorController {
  constructor(private readonly service: CanCollectorService) {}

  @Post('collect')
  @HttpCode(HttpStatus.CREATED)
  async collect(@Req() req: Request): Promise<{ received: number }> {
    const body = req.body as Buffer;

    if (!body || body.length === 0) {
      throw new BadRequestException('Empty payload');
    }
    if (body.length % FRAME_SIZE !== 0) {
      throw new BadRequestException(`Payload size must be a multiple of ${FRAME_SIZE} bytes`);
    }

    const deviceId = req.headers['x-device-id'] as string;
    const baseTs = parseInt(req.headers['x-base-ts'] as string, 10);

    if (!deviceId) {
      throw new BadRequestException('Missing X-Device-ID header');
    }
    if (isNaN(baseTs)) {
      throw new BadRequestException('Missing or invalid X-Base-Ts header');
    }

    const count = await this.service.collect(body, deviceId);
    return { received: count };
  }
}
