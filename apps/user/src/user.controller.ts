import { BadRequestException, Body, Controller, Get, HttpException, HttpStatus, Inject, Post, Query, SetMetadata } from '@nestjs/common';
import { UserService } from './user.service';
import { RedisService } from '@app/redis';
import { RegisterUserDto } from './dto/register-user.dto';
import { EmailService } from '@app/email';
import { ConfigService } from '@nestjs/config';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtService } from '@nestjs/jwt';
import { RequireLogin, UserInfo } from '@app/common';
import { UpdateUserPasswordDto } from './dto/update-user-password.dto';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly redisService: RedisService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService
  ) { }

  // 注册验证码
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

  // 注册
  @Post('register')
  async register(@Body() registerUser: RegisterUserDto) {
    return await this.userService.register(registerUser);
  }

  // 登录
  @Post('login')
  async userLogin(@Body() loginUser: LoginUserDto) {
    const user = await this.userService.login(loginUser);
    return {
      user,
      token: this.jwtService.sign({
        userId: user.id,
        username: user.username
      }, {
        expiresIn: '7d'
      })
    };
  }

  @Post('update_password')
  async updatePassword(@Body() passwordDto: UpdateUserPasswordDto) {
    return this.userService.updatePassword(passwordDto);
  }

  // 发送修改密码 邮箱验证码
  @Get('update_password/captcha')
  @RequireLogin()
  async updatePasswordCaptcha(@Query('address') address: string, @UserInfo() userInfo) {
    console.log('userInfo', userInfo);

    if (!address) {
      throw new BadRequestException('邮箱地址不能为空');
    }
    const code = this.generateCaptcha()

    const captchaTTL = this.configService.get<number>('CAPTCHA_TTL', 5 * 60);
    await this.redisService.set(`update_password_captcha_${address}`, code, captchaTTL);

    await this.emailService.sendMail({
      to: address,
      subject: '更改密码验证码',
      html: `<p>你的更改密码验证码是 ${code}</p>`
    });
    return '发送成功';
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
