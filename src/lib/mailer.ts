import nodemailer from 'nodemailer';

interface SendMailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export async function sendEmail({ to, subject, text, html }: SendMailOptions) {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || '"Growffiy Alerts" <noreply@growffiy.in>';

  let transporter: nodemailer.Transporter;

  if (host && user && pass) {
    // Production / Configured SMTP
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });
  } else {
    // Development Fallback: Create test account on ethereal.email dynamically
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      console.log('⚡ Ethereal SMTP Transporter initialized dynamically');
    } catch (err) {
      console.error('Failed to create Ethereal SMTP test account, logging only:', err);
      // Fallback transporter that logs to console
      return {
        success: false,
        previewUrl: null,
        message: 'No SMTP configured. Email logged to server console.'
      };
    }
  }

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`✉️ Test Email Preview URL: ${previewUrl}`);
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl
    };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}
