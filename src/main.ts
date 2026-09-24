import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { AppModule } from './app/app.module';
import * as bodyParser from 'body-parser';
import type { AppRouter } from '@app/trpc/app.router';
import { createContext } from '@app/trpc/trpc.context';
import { APP_ROUTER } from '@app/trpc/trpc.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.use(
    bodyParser.raw({
      type: 'application/octet-stream',
      limit: '10mb',
    })
  );

  const trpcLogger = new Logger('tRPC');
  app.use(
    '/trpc',
    createExpressMiddleware({
      router: app.get<AppRouter>(APP_ROUTER),
      createContext,
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

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
