import { PrismaService } from '@app/prisma';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { RedisService } from '@app/redis';
import { RegisterUserDto } from './dto/register-user.dto';

@Injectable()
export class UserService {

  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
  ) { }

  async create(data: Prisma.UserCreateInput) {
    return await this.prismaService.user.create({
      data,
      select: {
        id: true
      }
    });
  }

  async register(user: RegisterUserDto) {
    // 验证验证码
    const captcha = await this.redisService.get(`captcha_${user.email}`);
    console.log('captcha', captcha);

    this.validateCaptcha(captcha, user.captcha);

    // 检查用户名是否已存在
    await this.ensureUserNotExists(user.username);

    // 创建用户
    return this.createUser(user);
  }

  private validateCaptcha(storedCaptcha: string | null, userCaptcha: string) {
    if (!storedCaptcha) {
      throw new HttpException('验证码已失效', HttpStatus.BAD_REQUEST);
    }
    if (storedCaptcha !== userCaptcha) {
      throw new HttpException('验证码不正确', HttpStatus.BAD_REQUEST);
    }
  }

  private async ensureUserNotExists(username: string) {
    const foundUser = await this.prismaService.user.findUnique({
      where: { username },
    });
    if (foundUser) {
      throw new HttpException('用户已存在', HttpStatus.BAD_REQUEST);
    }
  }

  private async createUser(user: RegisterUserDto) {
    try {
      const newUser = await this.prismaService.user.create({
        data: {
          username: user.username,
          password: user.password,
          email: user.email,
        },
        select: {
          id: true,
          username: true,
          email: true,
          createTime: true,
        },
      });

      this.logger.log(`用户注册成功：${newUser.username}`);
      return newUser;
    } catch (error) {
      this.logger.error('用户注册失败', error);
      throw new HttpException('用户注册失败，请稍后再试', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }


}
