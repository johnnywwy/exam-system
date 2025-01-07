import { PrismaService } from '@app/prisma';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { RedisService } from '@app/redis';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { UpdateUserPasswordDto } from './dto/update-user-password.dto';

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

    this.validateCaptcha(captcha, user.captcha);

    // 检查用户名是否已存在
    await this.ensureUserNotExists(user.username);

    // 创建用户
    return this.createUser(user);
  }

  async login(loginUserDto: LoginUserDto) {
    const foundUser = await this.prismaService.user.findUnique({
      where: {
        username: loginUserDto.username
      }
    });

    if (!foundUser) {
      throw new HttpException('用户不存在', HttpStatus.BAD_REQUEST);
    }

    if (foundUser.password !== loginUserDto.password) {
      throw new HttpException('密码错误', HttpStatus.BAD_REQUEST);
    }

    delete foundUser.password;
    return foundUser;
  }

  async updatePassword(passwordDto: UpdateUserPasswordDto) {
    const captcha = await this.redisService.get(`update_password_captcha_${passwordDto.email}`);

    this.validateCaptcha(captcha, passwordDto.captcha);

    const foundUser = await this.prismaService.user.findUnique({
      where: {
        username: passwordDto.username
      }
    });

    foundUser.password = passwordDto.password;

    try {
      await this.prismaService.user.update({
        where: {
          id: foundUser.id
        },
        data: foundUser
      });
      return '密码修改成功';
    } catch (e) {
      this.logger.error(e, UserService);
      return '密码修改失败';
    }
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
