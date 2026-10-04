import { ConfigService } from '@nestjs/config';
import { betterAuth } from 'better-auth';
import { bearer } from 'better-auth/plugins';
import type { Pool } from 'pg';

const MIN_SECRET_LENGTH = 32;

export interface BetterAuthSettings {
  secret: string;
  baseURL: string;
  trustedOrigins: string[];
}

export function readBetterAuthSettings(config: ConfigService): BetterAuthSettings {
  const secret = config.getOrThrow<string>('BETTER_AUTH_SECRET');
  if (secret.length < MIN_SECRET_LENGTH) {
    throw new Error(`BETTER_AUTH_SECRET 는 ${MIN_SECRET_LENGTH}자 이상이어야 한다`);
  }

  const trustedOrigins = config
    .getOrThrow<string>('TRUSTED_ORIGINS')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return { secret, baseURL: config.getOrThrow<string>('BETTER_AUTH_URL'), trustedOrigins };
}

const timestampFields = { createdAt: 'created_at', updatedAt: 'updated_at' };

export function createBetterAuth(pool: Pool, settings: BetterAuthSettings) {
  return betterAuth({
    secret: settings.secret,
    baseURL: settings.baseURL,
    trustedOrigins: settings.trustedOrigins,
    basePath: '/auth',
    database: pool,
    emailAndPassword: { enabled: true, disableSignUp: true },
    rateLimit: { enabled: false },
    plugins: [bearer()],
    user: {
      modelName: 'auth_user',
      fields: { emailVerified: 'email_verified', ...timestampFields },
    },
    session: {
      modelName: 'auth_session',
      fields: {
        userId: 'user_id',
        expiresAt: 'expires_at',
        ipAddress: 'ip_address',
        userAgent: 'user_agent',
        ...timestampFields,
      },
    },
    account: {
      modelName: 'auth_account',
      fields: {
        accountId: 'account_id',
        providerId: 'provider_id',
        userId: 'user_id',
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        idToken: 'id_token',
        accessTokenExpiresAt: 'access_token_expires_at',
        refreshTokenExpiresAt: 'refresh_token_expires_at',
        ...timestampFields,
      },
    },
    verification: {
      modelName: 'auth_verification',
      fields: { expiresAt: 'expires_at', ...timestampFields },
    },
  });
}

export type BetterAuthInstance = ReturnType<typeof createBetterAuth>;
