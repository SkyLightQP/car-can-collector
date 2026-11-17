import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { cimd } from '@better-auth/cimd';
import { fetchClientMetadataResource } from '@better-auth/cimd/node';
import { mcp } from '@better-auth/mcp';
import type { Pool } from 'pg';
import { createBetterAuthOptions, isAllowedClientMetadataUrl, readBetterAuthSettings } from './better-auth';

jest.mock('better-auth', () => ({ betterAuth: jest.fn() }));
jest.mock('better-auth/plugins', () => ({ bearer: jest.fn(), jwt: jest.fn() }));
jest.mock('@better-auth/mcp', () => ({ mcp: jest.fn() }));
jest.mock('@better-auth/cimd', () => ({ cimd: jest.fn() }));
jest.mock('@better-auth/cimd/node', () => ({ fetchClientMetadataResource: jest.fn() }));

const SECRET = 'x'.repeat(32);

const REQUIRED_ENV = {
  BETTER_AUTH_SECRET: SECRET,
  BETTER_AUTH_URL: 'http://localhost:3000',
  TRUSTED_ORIGINS: 'http://localhost:5173',
  DASHBOARD_URL: 'http://localhost:5173',
};

function settingsFrom(env: Record<string, string>) {
  return readBetterAuthSettings(new ConfigService(env));
}

describe('readBetterAuthSettings', () => {
  it('TRUSTED_ORIGINS 를 쉼표로 나눠 신뢰할 origin 목록으로 쓴다', () => {
    const settings = settingsFrom({
      BETTER_AUTH_SECRET: SECRET,
      BETTER_AUTH_URL: 'http://localhost:3000',
      TRUSTED_ORIGINS: 'http://localhost:5173, https://dash.example.com',
      DASHBOARD_URL: 'http://localhost:5173',
    });

    expect(settings).toEqual({
      secret: SECRET,
      baseURL: 'http://localhost:3000',
      trustedOrigins: ['http://localhost:5173', 'https://dash.example.com'],
      dashboardUrl: 'http://localhost:5173',
      mcpResource: 'http://localhost:3000/mcp',
      allowedClientHosts: ['claude.ai', 'chatgpt.com'],
    });
  });

  it('TRUSTED_ORIGINS 가 없으면 기동 시점에 실패한다', () => {
    expect(() =>
      settingsFrom({
        BETTER_AUTH_SECRET: SECRET,
        BETTER_AUTH_URL: 'http://localhost:3000',
        DASHBOARD_URL: 'http://localhost:5173',
      })
    ).toThrow('TRUSTED_ORIGINS');
  });

  it('BETTER_AUTH_SECRET 이 32자보다 짧으면 기동 시점에 실패한다', () => {
    expect(() => settingsFrom({ ...REQUIRED_ENV, BETTER_AUTH_SECRET: 'short' })).toThrow('BETTER_AUTH_SECRET');
  });

  it('DASHBOARD_URL 과 BETTER_AUTH_URL 에서 로그인 페이지 기준 주소와 MCP 리소스 주소를 만든다', () => {
    const settings = settingsFrom({
      ...REQUIRED_ENV,
      BETTER_AUTH_URL: 'https://api.example.com/',
      DASHBOARD_URL: 'https://dash.example.com/',
    });

    expect(settings.dashboardUrl).toBe('https://dash.example.com');
    expect(settings.mcpResource).toBe('https://api.example.com/mcp');
  });

  it('MCP_ALLOWED_CLIENT_HOSTS 가 없으면 claude.ai 와 chatgpt.com 만 허용한다', () => {
    expect(settingsFrom(REQUIRED_ENV).allowedClientHosts).toEqual(['claude.ai', 'chatgpt.com']);
  });

  it('MCP_ALLOWED_CLIENT_HOSTS 를 쉼표로 나눠 허용 호스트로 쓴다', () => {
    const settings = settingsFrom({ ...REQUIRED_ENV, MCP_ALLOWED_CLIENT_HOSTS: ' claude.ai , example.org ,' });

    expect(settings.allowedClientHosts).toEqual(['claude.ai', 'example.org']);
  });

  it('DASHBOARD_URL 이 없으면 기동 시점에 실패한다', () => {
    expect(() =>
      settingsFrom({
        BETTER_AUTH_SECRET: SECRET,
        BETTER_AUTH_URL: 'http://localhost:3000',
        TRUSTED_ORIGINS: 'http://localhost:5173',
      })
    ).toThrow('DASHBOARD_URL');
  });
});

describe('isAllowedClientMetadataUrl', () => {
  const allowedHosts = ['claude.ai', 'chatgpt.com'];

  it('허용 호스트의 https 메타데이터 주소는 허용한다', () => {
    expect(isAllowedClientMetadataUrl('https://claude.ai/oauth/mcp-oauth-client-metadata', allowedHosts)).toBe(true);
  });

  it.each(['https://claude.ai.evil.com/x', 'http://claude.ai/x', 'https://evil.com/claude.ai', 'not a url'])(
    '%s 는 거부한다',
    (clientIdUrl) => {
      expect(isAllowedClientMetadataUrl(clientIdUrl, allowedHosts)).toBe(false);
    }
  );
});

describe('createBetterAuthOptions', () => {
  const database = {} as Pool;

  it('MCP OAuth 로그인과 동의 페이지를 대시보드로 보내고 /token 경로를 막는다', () => {
    const options = createBetterAuthOptions(database, settingsFrom(REQUIRED_ENV));

    expect(options.disabledPaths).toContain('/token');
    expect(mcp).toHaveBeenCalledWith(
      expect.objectContaining({
        loginPage: 'http://localhost:5173/oauth/login',
        consentPage: 'http://localhost:5173/oauth/consent',
        resource: 'http://localhost:3000/mcp',
      })
    );
  });

  it('세션만으로 OAuth client 를 만들고 바꾸고 조회하는 경로를 막는다', () => {
    const options = createBetterAuthOptions(database, settingsFrom(REQUIRED_ENV));

    expect(options.disabledPaths).toEqual(
      expect.arrayContaining([
        '/oauth2/create-client',
        '/oauth2/update-client',
        '/oauth2/delete-client',
        '/oauth2/client/rotate-secret',
        '/oauth2/get-clients',
        '/oauth2/get-client',
      ])
    );
  });

  it.each(['/oauth2/authorize', '/oauth2/token', '/oauth2/consent', '/oauth2/continue', '/oauth2/public-client'])(
    'OAuth 흐름과 대시보드가 쓰는 %s 경로는 막지 않는다',
    (path) => {
      const options = createBetterAuthOptions(database, settingsFrom(REQUIRED_ENV));

      expect(options.disabledPaths).not.toContain(path);
    }
  );

  it('CIMD 는 허용 호스트의 client 메타데이터 주소만 받아들이고 거부한 주소를 경고로 남긴다', () => {
    const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    createBetterAuthOptions(database, settingsFrom(REQUIRED_ENV));
    const [{ isMetadataDocumentUrlAllowed }] = jest.mocked(cimd).mock.lastCall!;

    expect(isMetadataDocumentUrlAllowed!('https://claude.ai/oauth/mcp-oauth-client-metadata', undefined!)).toBe(true);
    expect(isMetadataDocumentUrlAllowed!('https://evil.com/client', undefined!)).toBe(false);
    expect(warn).toHaveBeenCalledWith('CIMD client 거부: https://evil.com/client');
    warn.mockRestore();
  });

  it('CIMD 메타데이터 문서는 기본으로 Node 전송을 쓰고 overrides 로 바꿀 수 있다', () => {
    createBetterAuthOptions(database, settingsFrom(REQUIRED_ENV));
    expect(jest.mocked(cimd).mock.lastCall![0].fetchClientMetadataResource).toBe(fetchClientMetadataResource);

    const fakeFetch = jest.fn();
    createBetterAuthOptions(database, settingsFrom(REQUIRED_ENV), { fetchClientMetadataResource: fakeFetch });
    expect(jest.mocked(cimd).mock.lastCall![0].fetchClientMetadataResource).toBe(fakeFetch);
  });
});
