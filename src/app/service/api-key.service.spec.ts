import { ApiKey, hashApiKey } from '@app/domain/api-key/api-key';
import type { ApiKeyRepository, NewApiKey } from '@infrastructure/repository/api-key.repository';
import { ApiKeyService } from './api-key.service';

const KEY_ID = '7a1d2c3e-4f5a-4b6c-8d7e-9f0a1b2c3d4e';
const CREATED_AT = new Date('2026-11-17T01:02:03.000Z');

const deviceKey = ApiKey.from({ id: KEY_ID, name: 'ESP32', prefix: 'ccc_AbCdEfGh', createdAt: CREATED_AT });

function setup() {
  const repository = {
    findAll: jest.fn().mockResolvedValue([deviceKey]),
    existsByHash: jest.fn().mockResolvedValue(true),
    create: jest
      .fn<Promise<ApiKey>, [NewApiKey]>()
      .mockImplementation(({ name, keyPrefix }) =>
        Promise.resolve(ApiKey.from({ id: KEY_ID, name, prefix: keyPrefix, createdAt: CREATED_AT }))
      ),
    delete: jest.fn().mockResolvedValue(true),
  };
  const service = new ApiKeyService(repository as unknown as ApiKeyRepository);
  return { service, repository };
}

describe('ApiKeyService', () => {
  it('목록은 키 원문이나 hash 없이 이름, prefix, 생성 시각만 반환한다', async () => {
    const { service } = setup();
    await expect(service.listApiKeys()).resolves.toEqual([
      { id: KEY_ID, name: 'ESP32', prefix: 'ccc_AbCdEfGh', createdAt: '2026-11-17T01:02:03.000Z' },
    ]);
  });

  it('생성하면 원문 키는 응답에만 담고 저장소에는 hash 와 prefix 만 넘긴다', async () => {
    const { service, repository } = setup();
    const created = await service.createApiKey({ name: '새 장치' });

    expect(created.key).toMatch(/^ccc_/);
    expect(created).toMatchObject({ id: KEY_ID, name: '새 장치', prefix: created.key.slice(0, 12) });
    expect(repository.create).toHaveBeenCalledWith({
      name: '새 장치',
      keyHash: hashApiKey(created.key),
      keyPrefix: created.key.slice(0, 12),
    });
  });

  it('삭제 대상이 없으면 null 을 반환한다', async () => {
    const { service, repository } = setup();
    await expect(service.deleteApiKey({ id: KEY_ID })).resolves.toEqual({ id: KEY_ID });
    repository.delete.mockResolvedValue(false);
    await expect(service.deleteApiKey({ id: KEY_ID })).resolves.toBeNull();
  });

  describe('isValid', () => {
    it('헤더 키의 hash 로 저장소를 조회한다', async () => {
      const { service, repository } = setup();
      await expect(service.isValid('ccc_device')).resolves.toBe(true);
      expect(repository.existsByHash).toHaveBeenCalledWith(hashApiKey('ccc_device'));
    });

    it('키가 없거나 빈 문자열이면 조회 없이 false 다', async () => {
      const { service, repository } = setup();
      await expect(service.isValid(undefined)).resolves.toBe(false);
      await expect(service.isValid('')).resolves.toBe(false);
      expect(repository.existsByHash).not.toHaveBeenCalled();
    });
  });
});
