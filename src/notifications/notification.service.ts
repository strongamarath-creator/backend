import { Injectable, Logger } from "@nestjs/common";
import * as nodemailer from "nodemailer";

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    const created = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    }) as unknown;

    this.transporter = created as nodemailer.Transporter;
  }

  async sendEmail(to: string, subject: string, content: string) {
    try {
      const info = (await this.transporter.sendMail({
        from: process.env.SMTP_FROM || '"No Reply" <noreply@example.com>',
        to,
        subject,
        text: content, // plain text body
        // html: content, // html body
      })) as unknown;

      const messageId = (info as { messageId?: unknown }).messageId;
      if (typeof messageId === "string") {
        this.logger.log(`Message sent: ${messageId}`);
      } else {
        this.logger.log("Message sent");
      }
      return true;
    } catch (error) {
      this.logger.error(`Error sending email to ${to}:`, error);
      // Fallback to logging for development if SMTP fails
      this.logger.log(
        `[EMAIL FALLBACK] To: ${to} | Subject: ${subject} | Content: ${content}`,
      );
      return false;
    }
  }

  async sendSms(to: string, content: string) {
    // SMS integration requires a paid provider like Twilio.
    // For now, we log it. In a real app, uncomment the code below and install twilio SDK.
    this.logger.log(`[SMS] To: ${to} | Content: ${content}`);
    return Promise.resolve(true);
  }
}
