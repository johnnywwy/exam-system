import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // 配置模块全局可用
      envFilePath: ['.env'], // 指定加载环境变量文件
    }),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule { }
