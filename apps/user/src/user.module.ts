import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { RedisModule } from '@app/redis';
import { PrismaModule } from '@app/prisma';
import { EmailModule } from '@app/email';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthGuard, CommonModule } from '@app/common';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    RedisModule,
    PrismaModule,
    EmailModule,
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService], // 注入 ConfigService
      useFactory: (configService: ConfigService): JwtModuleOptions => ({
        secret: configService.get<string>('JWT_SECRET', 'defaultSecret'), // 从环境变量读取密钥，提供默认值
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '30m'), // 从环境变量读取过期时间
        },
      }),
    }),
    CommonModule
  ],
  controllers: [UserController],
  providers: [
    UserService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard
    }
  ],
})
export class UserModule { }
