import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as process from 'node:process';

@Injectable()
export class NodemailerService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async sendEmail(
    email: string,
    code: string,
    template: (code: string) => { html: string; subject: string },
  ): Promise<void> {
    const { html, subject } = template(code);

    await this.transporter.sendMail({
      from: `"BloggerPlatform" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      html,
    });
  }
}
