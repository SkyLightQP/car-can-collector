import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { CanRaw } from '@app/domain/can-raw';
import { CanRawRepository } from '@infrastructure/repository/can-raw.repository';
import { CanRecordRepository } from '@infrastructure/repository/can-record.repository';
import { CanDecodeService } from '@app/service/can-decode.service';

const FRAME_SIZE = 13;
const FLUSH_MS = 1000;

@Injectable()
export class CanCollectorService implements OnModuleInit, OnModuleDestroy {
  private readonly buffer: CanRaw[] = [];
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly canRawRepository: CanRawRepository,
    private readonly canRecordRepository: CanRecordRepository,
    private readonly canDecodeService: CanDecodeService
  ) {}

  onModuleInit(): void {
    this.flushTimer = setInterval(() => void this.#flush(), FLUSH_MS);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    await this.#flush();
  }

  collect(body: Buffer, deviceId: string): number {
    const serverTs = Date.now();
    const frames = this.#parseFrames(body, serverTs, deviceId);
    this.buffer.push(...frames);
    return frames.length;
  }

  async #flush(): Promise<void> {
    if (this.buffer.length === 0) return;
    const toSave = this.buffer.splice(0);
    const records = this.canDecodeService.decode(toSave);
    await Promise.all([this.canRawRepository.saveAll(toSave), this.canRecordRepository.saveAll(records)]);
  }

  #parseFrames(body: Buffer, baseTs: number, deviceId: string): CanRaw[] {
    const frames: CanRaw[] = [];

    for (let i = 0; i + FRAME_SIZE <= body.length; i += FRAME_SIZE) {
      const tsOffset = body.readUInt16LE(i);
      const canId = body.readUInt16LE(i + 2);
      const dlc = body.readUInt8(i + 4);
      const data = Buffer.from(body.subarray(i + 5, i + 13));

      frames.push(CanRaw.from(new Date(baseTs + tsOffset), deviceId, canId, dlc, data));
    }

    return frames;
  }
}
