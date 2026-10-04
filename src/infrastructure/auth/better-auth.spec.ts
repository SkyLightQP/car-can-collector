import { ConfigService } from '@nestjs/config';
import { readBetterAuthSettings } from './better-auth';

jest.mock('better-auth', () => ({ betterAuth: jest.fn() }));
jest.mock('better-auth/plugins', () => ({ bearer: jest.fn() }));

const SECRET = 'x'.repeat(32);

function settingsFrom(env: Record<string, string>) {
  return readBetterAuthSettings(new ConfigService(env));
}

describe('readBetterAuthSettings', () => {
  it('TRUSTED_ORIGINS 를 쉼표로 나눠 신뢰할 origin 목록으로 쓴다', () => {
    const settings = settingsFrom({
      BETTER_AUTH_SECRET: SECRET,
      BETTER_AUTH_URL: 'http://localhost:3000',
      TRUSTED_ORIGINS: 'http://localhost:5173, https://dash.example.com',
    });

    expect(settings).toEqual({
      secret: SECRET,
      baseURL: 'http://localhost:3000',
      trustedOrigins: ['http://localhost:5173', 'https://dash.example.com'],
    });
  });

  it('TRUSTED_ORIGINS 가 없으면 기동 시점에 실패한다', () => {
    expect(() => settingsFrom({ BETTER_AUTH_SECRET: SECRET, BETTER_AUTH_URL: 'http://localhost:3000' })).toThrow(
      'TRUSTED_ORIGINS'
    );
  });

  it('BETTER_AUTH_SECRET 이 32자보다 짧으면 기동 시점에 실패한다', () => {
    expect(() =>
      settingsFrom({
        BETTER_AUTH_SECRET: 'short',
        BETTER_AUTH_URL: 'http://localhost:3000',
        TRUSTED_ORIGINS: 'http://localhost:5173',
      })
    ).toThrow('BETTER_AUTH_SECRET');
  });
});
