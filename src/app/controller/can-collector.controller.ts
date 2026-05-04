import {
  BadRequestException,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  type RawBodyRequest,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { CanRaw } from '@app/domain/can-raw';
import { ApiKeyGuard } from './guards/api-key.guard';
import { CanCollectorService } from '@app/service/can-collector.service';

const FRAME_SIZE = 13;

@Controller('can-collector')
@UseGuards(ApiKeyGuard)
export class CanCollectorController {
  constructor(private readonly service: CanCollectorService) {}

  @Post('collect')
  @HttpCode(HttpStatus.CREATED)
  async collect(@Req() req: RawBodyRequest<Request>): Promise<{ received: number }> {
    const body = req.rawBody;

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

    const frames = this.parseFrames(body, baseTs, deviceId);

    await this.service.collect(frames);
    return { received: frames.length };
  }

  private parseFrames(body: Buffer, baseTs: number, deviceId: string): CanRaw[] {
    const frames: CanRaw[] = [];

    for (let i = 0; i + FRAME_SIZE <= body.length; i += FRAME_SIZE) {
      const tsOffset = body.readUInt16LE(i);
      const canId = body.readUInt16LE(i + 2);
      const dlc = body.readUInt8(i + 4);
      const data = Buffer.from(body.subarray(i + 5, i + 13));

      frames.push(new CanRaw(new Date(baseTs + tsOffset), deviceId, canId, dlc, data));
    }

    return frames;
  }
}
