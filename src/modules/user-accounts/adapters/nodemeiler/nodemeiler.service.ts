import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NodemailerService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST', 'smtp.yandex.by');
    const port = this.configService.get<number>('SMTP_PORT', 465);
    const secure = this.configService.get<boolean>('SMTP_SECURE', true);
    const user = this.configService.get<string>('EMAIL_USER');
    const password = this.configService.get<string>('EMAIL_PASSWORD');

    if (!user || !password) {
      throw new Error('Отсутствуют данные для аутентификации email');
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass: password,
      },
    });
  }

  async sendEmail(
    email: string,
    code: string,
    template: (code: string) => { html: string; subject: string },
  ): Promise<void> {
    const { html, subject } = template(code);

    try {
      await this.transporter.sendMail({
        from: `"BloggerPlatform" <${this.configService.get<string>('EMAIL_USER')}>`,
        to: email,
        subject,
        html,
      });
    } catch (error) {
      console.error('Ошибка отправки email:', error);
      throw new Error('Не удалось отправить email');
    }
  }
}
