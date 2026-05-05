import { Injectable, Logger } from '@nestjs/common';
import { CanRaw } from '@app/domain/can-raw';
import { CanRawRepository } from '@infrastructure/repository/can-raw.repository';
import { CanRecordRepository } from '@infrastructure/repository/can-record.repository';
import { CanDecodeService } from '@app/service/can-decode.service';

const FRAME_SIZE = 13;

@Injectable()
export class CanCollectorService {
  private readonly logger = new Logger(CanCollectorService.name);

  constructor(
    private readonly canRawRepository: CanRawRepository,
    private readonly canRecordRepository: CanRecordRepository,
    private readonly canDecodeService: CanDecodeService
  ) {}

  async collect(body: Buffer, deviceId: string): Promise<number> {
    const collectionTime = Date.now();
    const frames = this.#parseFrames(body, collectionTime, deviceId);

    const records = this.canDecodeService.decode(frames);
    await Promise.all([this.canRawRepository.saveAll(frames), this.canRecordRepository.saveAll(records)]);

    this.logger.log(`saved ${frames.length} raw frames`);
    return frames.length;
  }

  #parseFrames(body: Buffer, baseTs: number, deviceId: string): CanRaw[] {
    const frames: CanRaw[] = [];

    for (let i = 0; i + FRAME_SIZE <= body.length; i += FRAME_SIZE) {
      const tsOffset = body.readUInt16LE(i);
      const canId = body.readUInt16LE(i + 2);
      const dlc = body.readUInt8(i + 4);
      const data = Buffer.from(body.subarray(i + 5, i + 13));

      const timestamp = new Date(baseTs + tsOffset);
      frames.push(CanRaw.from(timestamp, deviceId, canId, dlc, data));
    }

    return frames;
  }
}
