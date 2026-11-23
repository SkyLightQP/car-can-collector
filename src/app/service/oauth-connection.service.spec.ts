import type {
  OAuthConnectionRepository,
  OAuthConnectionRow,
} from '@infrastructure/repository/oauth-connection.repository';
import { OAuthConnectionService } from './oauth-connection.service';

const claude: OAuthConnectionRow = {
  id: 'consent-1',
  clientId: 'https://claude.ai/oauth/mcp-oauth-client-metadata',
  clientName: 'Claude',
  scopes: ['openid', 'offline_access'],
  connectedAt: new Date('2026-11-17T01:02:03.000Z'),
  lastTokenIssuedAt: new Date('2026-11-20T05:06:07.000Z'),
};

const chatgpt: OAuthConnectionRow = {
  id: 'consent-2',
  clientId: 'https://chatgpt.com/oauth/client-metadata',
  clientName: null,
  scopes: ['openid'],
  connectedAt: new Date('2026-11-10T00:00:00.000Z'),
  lastTokenIssuedAt: null,
};

function setup() {
  const repository = {
    findByUser: jest.fn().mockResolvedValue([claude, chatgpt]),
    revoke: jest.fn().mockResolvedValue(true),
  };
  const service = new OAuthConnectionService(repository as unknown as OAuthConnectionRepository);
  return { service, repository };
}

describe('OAuthConnectionService', () => {
  it('목록은 사용자의 연결을 시각은 ISO 문자열로, 토큰 발급 기록이 없으면 null 로 반환한다', async () => {
    const { service, repository } = setup();
    await expect(service.listOAuthConnections('user-1')).resolves.toEqual([
      {
        id: 'consent-1',
        clientId: 'https://claude.ai/oauth/mcp-oauth-client-metadata',
        clientName: 'Claude',
        scopes: ['openid', 'offline_access'],
        connectedAt: '2026-11-17T01:02:03.000Z',
        lastTokenIssuedAt: '2026-11-20T05:06:07.000Z',
      },
      {
        id: 'consent-2',
        clientId: 'https://chatgpt.com/oauth/client-metadata',
        clientName: null,
        scopes: ['openid'],
        connectedAt: '2026-11-10T00:00:00.000Z',
        lastTokenIssuedAt: null,
      },
    ]);
    expect(repository.findByUser).toHaveBeenCalledWith('user-1');
  });

  it('취소는 사용자 id 와 연결 id 로 저장소에 맡기고 대상이 없으면 null 을 반환한다', async () => {
    const { service, repository } = setup();
    await expect(service.revokeOAuthConnection('user-1', { id: 'consent-1' })).resolves.toEqual({ id: 'consent-1' });
    expect(repository.revoke).toHaveBeenCalledWith('user-1', 'consent-1');
    repository.revoke.mockResolvedValue(false);
    await expect(service.revokeOAuthConnection('user-1', { id: 'consent-1' })).resolves.toBeNull();
  });
});
