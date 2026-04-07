import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter;

  constructor() {
    const host = process.env.MAIL_HOST;
    const user = process.env.MAIL_USER;
    const pass = process.env.MAIL_PASS;

    const hasRealSmtp =
      host && user && pass &&
      host !== 'smtp.mailtrap.io' &&
      user !== 'dev' && pass !== 'dev';

    if (process.env.NODE_ENV === 'production' || hasRealSmtp) {
      this.transporter = nodemailer.createTransport({
        host,
        port: parseInt(process.env.MAIL_PORT ?? '587', 10),
        secure: parseInt(process.env.MAIL_PORT ?? '587', 10) === 465,
        auth: { user, pass },
      });
    } else {

      this.transporter = nodemailer.createTransport({
        streamTransport: true,
        newline: 'unix',
        buffer: true,
      });
    }
  }

  private get fromAddress(): string {
    return process.env.MAIL_FROM ?? '"Uevent" <noreply@uevent.com>';
  }

  private get frontendUrl(): string {
    return process.env.FRONTEND_URL ?? 'http://localhost:3000';
  }

  async sendEmailConfirmation(to: string, token: string): Promise<void> {
    const url = `${this.frontendUrl}/auth/confirm-email?token=${token}`;
    await this.send(to, 'Confirm your Uevent account', this.confirmTemplate(url));
  }

  async sendPasswordReset(to: string, token: string): Promise<void> {
    const url = `${this.frontendUrl}/auth/reset-password?token=${token}`;
    await this.send(to, 'Reset your Uevent password', this.resetTemplate(url));
  }

  async sendTicketConfirmation(
    to: string,
    eventTitle: string,
    eventDate: Date,
    qrCode: string,
    ticketId: number,
  ): Promise<void> {
    const html = this.ticketTemplate(eventTitle, eventDate, qrCode, ticketId);
    await this.send(to, `Your ticket for ${eventTitle}`, html);
  }

  async sendCustomNotification(
    to: string,
    subject: string,
    body: string,
  ): Promise<void> {
    await this.send(to, subject, `<div style="font-family:sans-serif;padding:20px">${body}</div>`);
  }

  async sendEventReminder(
    to: string,
    eventTitle: string,
    eventDate: Date,
    ticketId: number,
    qrCode: string,
  ): Promise<void> {
    const html = this.reminderTemplate(eventTitle, eventDate, ticketId, qrCode);
    await this.send(to, `⏰ Нагадування: завтра "${eventTitle}"`, html);
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    try {
      const info = await this.transporter.sendMail({
        from: this.fromAddress,
        to,
        subject,
        html,
      });
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}`, err);
    }
  }

  private reminderTemplate(
    eventTitle: string,
    eventDate: Date,
    ticketId: number,
    qrCode: string,
  ): string {
    return `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:40px 20px">
        <h1 style="color:#1a1a2e">⏰ Нагадування про подію</h1>
        <p style="font-size:16px">Не забудьте — завтра відбудеться подія, на яку ви придбали квиток!</p>
        <div style="background:#f0f4ff;border-left:4px solid #e94560;padding:20px;border-radius:8px;margin:24px 0">
          <h2 style="margin:0 0 8px;color:#1a1a2e">${eventTitle}</h2>
          <p style="margin:0;color:#555"><strong>Дата:</strong> ${eventDate.toLocaleString('uk-UA', { dateStyle: 'long', timeStyle: 'short' })}</p>
        </div>
        <div style="background:#f8f9fa;padding:20px;border-radius:8px;margin:20px 0;text-align:center">
          <p style="color:#666;font-size:13px;margin:0 0 8px">QR-код для входу</p>
          <p style="font-family:monospace;font-size:15px;letter-spacing:2px;color:#1a1a2e;margin:0">${qrCode}</p>
        </div>
        <a href="${this.frontendUrl}/tickets/${ticketId}" style="display:inline-block;padding:14px 28px;background:#e94560;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">
          Переглянути квиток
        </a>
        <p style="color:#aaa;font-size:12px;margin-top:32px">Ви отримали цей лист, бо придбали квиток на Uevent.</p>
      </div>
    `;
  }

  private confirmTemplate(url: string): string {
    return `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:40px 20px">
        <h1 style="color:#1a1a2e">Welcome to Uevent 🎉</h1>
        <p>Thanks for signing up! Click the button below to confirm your email address.</p>
        <a href="${url}" style="display:inline-block;margin:20px 0;padding:14px 28px;background:#e94560;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">
          Confirm Email
        </a>
        <p style="color:#666;font-size:14px">Link expires in 24 hours. If you didn't create an account, ignore this email.</p>
      </div>
    `;
  }

  private resetTemplate(url: string): string {
    return `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:40px 20px">
        <h1 style="color:#1a1a2e">Reset Your Password</h1>
        <p>We received a request to reset your Uevent password.</p>
        <a href="${url}" style="display:inline-block;margin:20px 0;padding:14px 28px;background:#e94560;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">
          Reset Password
        </a>
        <p style="color:#666;font-size:14px">Link expires in 1 hour. If you didn't request this, ignore this email.</p>
      </div>
    `;
  }

  private ticketTemplate(
    eventTitle: string,
    eventDate: Date,
    qrCode: string,
    ticketId: number,
  ): string {
    return `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:40px 20px">
        <h1 style="color:#1a1a2e">Your Ticket 🎟️</h1>
        <h2>${eventTitle}</h2>
        <p><strong>Date:</strong> ${eventDate.toLocaleString()}</p>
        <p><strong>Ticket ID:</strong> #${ticketId}</p>
        <div style="background:#f8f9fa;padding:20px;border-radius:8px;margin:20px 0;text-align:center">
          <p style="font-family:monospace;font-size:16px;letter-spacing:2px">${qrCode}</p>
          <p style="color:#666;font-size:12px">Show this code at the entrance</p>
        </div>
        <a href="${this.frontendUrl}/tickets/${ticketId}" style="display:inline-block;padding:14px 28px;background:#e94560;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">
          View Ticket
        </a>
      </div>
    `;
  }
}
