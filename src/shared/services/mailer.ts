import nodemailer from 'nodemailer';
import { prisma } from '../../database/db';

interface SendMailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export async function sendEmail({ to, subject, text, html }: SendMailOptions) {
  try {
    // Fetch SMTP settings strictly from database
    const dbSettings = await prisma.appSettings.findMany({
      where: {
        settingKey: {
          in: [
            'smtp_host',
            'smtp_port',
            'smtp_user',
            'smtp_password',
            'smtp_sender_name',
            'smtp_status'
          ]
        }
      }
    });

    const settings: Record<string, string> = {};
    dbSettings.forEach(s => {
      settings[s.settingKey] = s.settingValue;
    });

    const host = settings['smtp_host'];
    const port = parseInt(settings['smtp_port'] || '587', 10);
    const user = settings['smtp_user'];
    const pass = settings['smtp_password'];
    const senderName = settings['smtp_sender_name'] || 'Growffiy Alerts';
    const status = settings['smtp_status'] || 'false';

    // If SMTP status is not active, skip
    if (status !== 'true') {
      console.log('✉️ SMTP is turned off in database settings. Skipping email dispatch.');
      return {
        success: false,
        message: 'SMTP status is disabled.'
      };
    }

    if (!host || !user || !pass) {
      console.log('✉️ SMTP host/user/password credentials are missing in DB. Skipping email.');
      return {
        success: false,
        message: 'SMTP credentials missing.'
      };
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });

    const from = `"${senderName}" <${user}>`;

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });

    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
