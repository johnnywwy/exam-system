import { Body, Controller, Get, HttpException, HttpStatus, Inject, Post, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { RedisService } from '@app/redis';
import { RegisterUserDto } from './dto/register-user.dto';
import { EmailService } from '@app/email';
import { ConfigService } from '@nestjs/config';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly redisService: RedisService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) { }

  @Get('register-captcha')
  async captcha(@Query('address') address: string) {
    console.log('address', address);

    // 校验邮箱地址格式
    if (!this.validateEmail(address)) {
      throw new HttpException('邮箱地址格式不正确', HttpStatus.BAD_REQUEST);
    }

    // 生成验证码
    const code = this.generateCaptcha();

    // 获取验证码有效期配置
    const captchaTTL = this.configService.get<number>('CAPTCHA_TTL', 5 * 60);

    // 存储验证码到 Redis
    await this.redisService.set(`captcha_${address}`, code, captchaTTL);

    // 发送邮件
    try {
      await this.emailService.sendCaptchaMail(address, code);
      return { message: '验证码发送成功' };
    } catch (error) {
      throw new HttpException('验证码发送失败，请稍后重试', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('register')
  async register(@Body() registerUser: RegisterUserDto) {
    return await this.userService.register(registerUser);
  }

  // 生成验证码
  private generateCaptcha(): string {
    return Math.random().toString().slice(2, 8);
  }

  // 验证邮箱地址格式
  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
