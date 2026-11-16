import { createCallerFactory } from '../trpc';
import type { ApiKeyView, CreatedApiKey } from '@app/trpc';
import { type ApiKeyOperations, createApiKeyRouter } from './api-key.router';

const user = { id: 'user-1', email: 'me@example.com', name: '나' };

const KEY_ID = '7a1d2c3e-4f5a-4b6c-8d7e-9f0a1b2c3d4e';

const apiKey: ApiKeyView = {
  id: KEY_ID,
  name: 'ESP32',
  prefix: 'ccc_AbCdEfGh',
  createdAt: '2026-11-17T01:02:03.000Z',
};
const created: CreatedApiKey = { ...apiKey, key: 'ccc_AbCdEfGh-rest-of-key' };

function setup(currentUser: typeof user | null = user) {
  const operations = {
    listApiKeys: jest.fn().mockResolvedValue([apiKey]),
    createApiKey: jest.fn().mockResolvedValue(created),
    deleteApiKey: jest.fn().mockResolvedValue({ id: KEY_ID }),
  } satisfies ApiKeyOperations;
  const caller = createCallerFactory(createApiKeyRouter(operations))({ user: currentUser });
  return { caller, ...operations };
}

describe('apiKeys router', () => {
  it('list 는 키 목록을 반환한다', async () => {
    const { caller } = setup();
    await expect(caller.list()).resolves.toEqual([apiKey]);
  });

  it('create 는 이름을 trim 해서 넘기고 원문 키를 포함해 반환한다', async () => {
    const { caller, createApiKey } = setup();
    await expect(caller.create({ name: '  ESP32  ' })).resolves.toEqual(created);
    expect(createApiKey).toHaveBeenCalledWith({ name: 'ESP32' });
  });

  it('create 는 빈 이름이나 50자 초과 이름을 BAD_REQUEST 로 거절한다', async () => {
    const { caller, createApiKey } = setup();
    await expect(caller.create({ name: '   ' })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    await expect(caller.create({ name: 'a'.repeat(51) })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    expect(createApiKey).not.toHaveBeenCalled();
  });

  it('delete 대상이 없으면 NOT_FOUND 다', async () => {
    const { caller, deleteApiKey } = setup();
    await expect(caller.delete({ id: KEY_ID })).resolves.toEqual({ id: KEY_ID });
    deleteApiKey.mockResolvedValue(null);
    await expect(caller.delete({ id: KEY_ID })).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('로그인하지 않으면 UNAUTHORIZED 이고 기능을 호출하지 않는다', async () => {
    const { caller, listApiKeys, createApiKey, deleteApiKey } = setup(null);
    await expect(caller.list()).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    await expect(caller.create({ name: 'x' })).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    await expect(caller.delete({ id: KEY_ID })).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    expect(listApiKeys).not.toHaveBeenCalled();
    expect(createApiKey).not.toHaveBeenCalled();
    expect(deleteApiKey).not.toHaveBeenCalled();
  });
});
