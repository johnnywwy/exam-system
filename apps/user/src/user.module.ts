import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { RedisModule } from '@app/redis';
import { PrismaModule } from '@app/prisma';

@Module({
  imports: [
    RedisModule,
    PrismaModule
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule { }
