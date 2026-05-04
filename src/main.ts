import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.use(
    bodyParser.raw({
      type: 'application/octet-stream',
      limit: '10mb',
    })
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
