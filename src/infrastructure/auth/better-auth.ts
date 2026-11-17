import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { cimd } from '@better-auth/cimd';
import { fetchClientMetadataResource } from '@better-auth/cimd/node';
import { mcp } from '@better-auth/mcp';
import type { ClientMetadataResourceFetch } from '@better-auth/oauth-provider';
import { type BetterAuthOptions, type DBAdapterInstance, betterAuth } from 'better-auth';
import { bearer, jwt } from 'better-auth/plugins';
import type { Pool } from 'pg';
import { jwksSchema, oauthProviderSchema } from './oauth-schema';

const MIN_SECRET_LENGTH = 32;
const DEFAULT_ALLOWED_CLIENT_HOSTS = ['claude.ai', 'chatgpt.com'];
const TRAILING_SLASHES = /\/+$/;
const DISABLED_AUTH_PATHS = [
  '/token',
  '/oauth2/create-client',
  '/oauth2/update-client',
  '/oauth2/delete-client',
  '/oauth2/client/rotate-secret',
  '/oauth2/get-clients',
  '/oauth2/get-client',
];

const mcpOAuthLogger = new Logger('McpOAuth');

export interface BetterAuthSettings {
  secret: string;
  baseURL: string;
  trustedOrigins: string[];
  dashboardUrl: string;
  mcpResource: string;
  allowedClientHosts: string[];
}

function splitCommaSeparated(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function readBetterAuthSettings(config: ConfigService): BetterAuthSettings {
  const secret = config.getOrThrow<string>('BETTER_AUTH_SECRET');
  if (secret.length < MIN_SECRET_LENGTH) {
    throw new Error(`BETTER_AUTH_SECRET 는 ${MIN_SECRET_LENGTH}자 이상이어야 한다`);
  }

  const trustedOrigins = splitCommaSeparated(config.getOrThrow<string>('TRUSTED_ORIGINS'));
  const baseURL = config.getOrThrow<string>('BETTER_AUTH_URL');
  const dashboardUrl = config.getOrThrow<string>('DASHBOARD_URL').replace(TRAILING_SLASHES, '');
  const mcpResource = `${baseURL.replace(TRAILING_SLASHES, '')}/mcp`;

  const configuredClientHosts = config.get<string>('MCP_ALLOWED_CLIENT_HOSTS')?.trim();
  const allowedClientHosts = configuredClientHosts
    ? splitCommaSeparated(configuredClientHosts)
    : DEFAULT_ALLOWED_CLIENT_HOSTS;

  return { secret, baseURL, trustedOrigins, dashboardUrl, mcpResource, allowedClientHosts };
}

export function isAllowedClientMetadataUrl(clientIdUrl: string, allowedHosts: readonly string[]): boolean {
  if (!URL.canParse(clientIdUrl)) {
    return false;
  }

  const url = new URL(clientIdUrl);
  return url.protocol === 'https:' && allowedHosts.includes(url.hostname);
}

const timestampFields = { createdAt: 'created_at', updatedAt: 'updated_at' };

export interface BetterAuthOverrides {
  fetchClientMetadataResource?: ClientMetadataResourceFetch;
}

export function createBetterAuthOptions(
  database: Pool | DBAdapterInstance,
  settings: BetterAuthSettings,
  overrides: BetterAuthOverrides = {}
): BetterAuthOptions {
  const isMetadataDocumentUrlAllowed = (clientIdUrl: string) => {
    if (isAllowedClientMetadataUrl(clientIdUrl, settings.allowedClientHosts)) {
      return true;
    }
    mcpOAuthLogger.warn(`CIMD client 거부: ${clientIdUrl}`);
    return false;
  };

  return {
    secret: settings.secret,
    baseURL: settings.baseURL,
    trustedOrigins: settings.trustedOrigins,
    basePath: '/auth',
    database,
    disabledPaths: DISABLED_AUTH_PATHS,
    emailAndPassword: { enabled: true, disableSignUp: true },
    rateLimit: { enabled: false },
    plugins: [
      bearer(),
      jwt({ disableSettingJwtHeader: true, schema: jwksSchema }),
      mcp({
        loginPage: `${settings.dashboardUrl}/oauth/login`,
        consentPage: `${settings.dashboardUrl}/oauth/consent`,
        resource: settings.mcpResource,
        schema: oauthProviderSchema,
      }),
      cimd({
        fetchClientMetadataResource: overrides.fetchClientMetadataResource ?? fetchClientMetadataResource,
        metadataProfile: 'mcp-2026-07-28',
        isMetadataDocumentUrlAllowed,
      }),
    ],
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
  };
}

export function createBetterAuth(pool: Pool, settings: BetterAuthSettings) {
  return betterAuth(createBetterAuthOptions(pool, settings));
}

export type BetterAuthInstance = ReturnType<typeof createBetterAuth>;
