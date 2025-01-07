import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // 配置模块全局可用
    }),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule { }
