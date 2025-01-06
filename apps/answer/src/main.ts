import { NestFactory } from '@nestjs/core';
import { AnswerModule } from './answer.module';
import { Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AnswerModule);

  app.connectMicroservice({
    transport: Transport.TCP,
    options: {
      port: 8888
    }
  })
  app.startAllMicroservices()

  await app.listen(process.env.port ?? 3003);
}
bootstrap();
