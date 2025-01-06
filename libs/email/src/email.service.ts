import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = createTransport({
      host: this.configService.get<string>('EMAIL_HOST', 'smtp.qq.com'), // 邮件服务器地址
      port: this.configService.get<number>('EMAIL_PORT', 587),          // 邮件服务器端口
      secure: this.configService.get<boolean>('EMAIL_SECURE', false),   // 是否启用 TLS
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),             // 邮箱地址
        pass: this.configService.get<string>('EMAIL_PASS'),             // 邮箱授权码
      },
    });
  }

  async sendMail({
    to,
    subject,
    html,
  }: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: {
          name: this.configService.get<string>('EMAIL_FROM_NAME', '考试系统'), // 默认发件人名称
          address: this.configService.get<string>('EMAIL_USER'),              // 默认发件人邮箱
        },
        to,
        subject,
        html,
      });

      this.logger.log(`邮件发送成功：${to}`);
    } catch (error) {
      this.logger.error(`邮件发送失败：${to}`, error.stack);
      throw new Error('邮件发送失败，请稍后再试');
    }
  }

  // 专门用于发送验证码的封装方法
  async sendCaptchaMail(to: string, code: string): Promise<void> {
    const subject = '注册验证码';
    const html = `<p>你的注册验证码是 <strong>${code}</strong></p>`;
    await this.sendMail({ to, subject, html });
  }
}
