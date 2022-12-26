import { NestFactory } from '@nestjs/core';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AppModule } from './app.module';
import { PrismaService } from './components/prisma/prisma.service';
import { PbEnv } from './config/environments/pb-env.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const winstonLogger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  app.useLogger(winstonLogger);
  const pbEnv = app.get(PbEnv);

  const prismaService: PrismaService = app.get(PrismaService);
  prismaService.enableShutdownHooks(app);
  prismaService.enableLogger(winstonLogger);

  console.log(`PORT: ${pbEnv.Port}`);
  await app.listen(pbEnv.Port, '0.0.0.0');
  winstonLogger.log(`PORT: ${pbEnv.Port}`);
  winstonLogger.log(`NodeEnv: ${pbEnv.NodeEnv}`);
  winstonLogger.log(`DatabaseUrl: ${pbEnv.DatabaseUrl}`);
}
bootstrap();
