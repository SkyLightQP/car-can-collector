import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { type BetterAuthInstance, createBetterAuth, readBetterAuthSettings } from './better-auth';
import { BetterAuthSessionReader } from './better-auth-session-reader';
import { sharedPgPool } from './shared-pg-pool';

export const BETTER_AUTH = Symbol('BETTER_AUTH');
export const AUTH_SESSION_READER = Symbol('AUTH_SESSION_READER');

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: BETTER_AUTH,
      inject: [DataSource, ConfigService],
      useFactory: (dataSource: DataSource, config: ConfigService) =>
        createBetterAuth(sharedPgPool(dataSource), readBetterAuthSettings(config)),
    },
    {
      provide: AUTH_SESSION_READER,
      inject: [BETTER_AUTH],
      useFactory: (auth: BetterAuthInstance) => new BetterAuthSessionReader(auth),
    },
  ],
  exports: [BETTER_AUTH, AUTH_SESSION_READER],
})
export class AuthModule {}
