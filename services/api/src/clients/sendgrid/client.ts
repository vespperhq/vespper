import { MailService, MailDataRequired } from "@sendgrid/mail";

interface SendEmailParams {
  recipient: string;
  subject: string;
  text?: string;
  html?: string;
}

export class SendGridClient {
  private readonly client: MailService;

  constructor(apiKey: string) {
    this.client = new MailService();
    this.client.setApiKey(apiKey);
  }

  sendEmail = async ({ recipient, subject, text, html }: SendEmailParams) => {
    const msg = {
      to: recipient, // Change to your recipient
      from: {
        email: "info@merlinn.co",
        name: "Merlinn",
      },
      subject,
      text,
      html,
    } as MailDataRequired;

    try {
      await this.client.send(msg);
    } catch (error) {
      console.log(error);
    }
  };
}
