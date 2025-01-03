import { NestFactory } from '@nestjs/core';
import { ExamModule } from './exam.module';

async function bootstrap() {
  const app = await NestFactory.create(ExamModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
