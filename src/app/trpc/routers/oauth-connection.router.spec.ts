import { createCallerFactory } from '../trpc';
import type { OAuthConnectionView } from '@app/trpc';
import { createOAuthConnectionRouter, type OAuthConnectionOperations } from './oauth-connection.router';

const user = { id: 'user-1', email: 'me@example.com', name: '나' };

const CONSENT_ID = 'consent-1';

const connection: OAuthConnectionView = {
  id: CONSENT_ID,
  clientId: 'https://claude.ai/oauth/mcp-oauth-client-metadata',
  clientName: 'Claude',
  scopes: ['openid', 'offline_access'],
  connectedAt: '2026-11-17T01:02:03.000Z',
  lastTokenIssuedAt: null,
};

function setup(currentUser: typeof user | null = user) {
  const operations = {
    listOAuthConnections: jest.fn().mockResolvedValue([connection]),
    revokeOAuthConnection: jest.fn().mockResolvedValue({ id: CONSENT_ID }),
  } satisfies OAuthConnectionOperations;
  const caller = createCallerFactory(createOAuthConnectionRouter(operations))({ user: currentUser });
  return { caller, ...operations };
}

describe('oauthConnections router', () => {
  it('list 는 로그인한 사용자의 연결 목록을 반환한다', async () => {
    const { caller, listOAuthConnections } = setup();
    await expect(caller.list()).resolves.toEqual([connection]);
    expect(listOAuthConnections).toHaveBeenCalledWith('user-1');
  });

  it('revoke 는 로그인한 사용자 기준으로 취소하고 대상이 없으면 NOT_FOUND 다', async () => {
    const { caller, revokeOAuthConnection } = setup();
    await expect(caller.revoke({ id: CONSENT_ID })).resolves.toEqual({ id: CONSENT_ID });
    expect(revokeOAuthConnection).toHaveBeenCalledWith('user-1', { id: CONSENT_ID });
    revokeOAuthConnection.mockResolvedValue(null);
    await expect(caller.revoke({ id: CONSENT_ID })).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('revoke 는 빈 id 를 BAD_REQUEST 로 거절한다', async () => {
    const { caller, revokeOAuthConnection } = setup();
    await expect(caller.revoke({ id: '' })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    expect(revokeOAuthConnection).not.toHaveBeenCalled();
  });

  it('로그인하지 않으면 UNAUTHORIZED 이고 기능을 호출하지 않는다', async () => {
    const { caller, listOAuthConnections, revokeOAuthConnection } = setup(null);
    await expect(caller.list()).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    await expect(caller.revoke({ id: CONSENT_ID })).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    expect(listOAuthConnections).not.toHaveBeenCalled();
    expect(revokeOAuthConnection).not.toHaveBeenCalled();
  });
});
