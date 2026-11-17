import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { toNodeHandler } from 'better-auth/node';
import { AppModule } from './app/app.module';
import * as bodyParser from 'body-parser';
import type { AppRouter } from '@app/trpc/app.router';
import { createContextFactory, type AuthSessionReader } from '@app/trpc/trpc.context';
import { APP_ROUTER } from '@app/trpc/trpc.module';
import { AUTH_SESSION_READER, BETTER_AUTH } from '@infrastructure/auth/auth.module';
import { readBetterAuthSettings, type BetterAuthInstance } from '@infrastructure/auth/better-auth';
import { createMcpRoute } from '@infrastructure/auth/mcp-route';
import { toExpressHandler } from '@infrastructure/http/fetch-handler';
import { MCP_HTTP_HANDLER } from '@app/mcp/mcp.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true });

  const auth = app.get<BetterAuthInstance>(BETTER_AUTH);
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.all('/auth/*splat', toNodeHandler(auth));
  expressApp.all('/.well-known/*splat', toNodeHandler(auth));
  const settings = readBetterAuthSettings(app.get(ConfigService));
  expressApp.all('/mcp', toExpressHandler(createMcpRoute(auth, app.get(MCP_HTTP_HANDLER), settings.mcpResource)));

  const trpcLogger = new Logger('tRPC');
  app.use(
    '/trpc',
    createExpressMiddleware({
      router: app.get<AppRouter>(APP_ROUTER),
      createContext: createContextFactory(app.get<AuthSessionReader>(AUTH_SESSION_READER)),
      onError: ({ path, error }) => {
        const message = `[${error.code}] ${path ?? '<unknown>'}: ${error.message}`;
        if (error.code === 'INTERNAL_SERVER_ERROR') {
          trpcLogger.error(message, error.cause?.stack ?? error.stack);
        } else {
          trpcLogger.warn(message);
        }
      },
    })
  );

  app.use(
    bodyParser.raw({
      type: 'application/octet-stream',
      limit: '10mb',
    })
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
