import nodemailer, { SendMailOptions } from "nodemailer";
import { parseConnectionUrl } from "nodemailer/lib/shared";

interface SendEmailParams {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export class EmailClient {
  private readonly transporter: nodemailer.Transporter;

  constructor(smtpConnectionUrl: string) {
    this.transporter = nodemailer.createTransport(
      parseConnectionUrl(smtpConnectionUrl),
    );
  }

  sendEmail = async ({ to, subject, text, html }: SendEmailParams) => {
    const msg = {
      to,
      from: '"Merlinn" <info@merlinn.co>',
      subject,
      text,
      html,
    } as SendMailOptions;

    try {
      await this.transporter.sendMail(msg);
    } catch (error) {
      console.log(error);
    }
  };
}
