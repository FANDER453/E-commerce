import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {ValidationMetadata} from "class-validator/types/metadata/ValidationMetadata";
import {ValidationPipe} from "@nestjs/common";
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser())
  app.setGlobalPrefix('/api')
  app.enableCors({
    origin: true,
    credentials: true,
  })
  app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true
      })
  )

  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
