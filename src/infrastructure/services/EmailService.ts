// services/emailService.ts
import sgMail from '@sendgrid/mail';

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export const sendEmail = async (to: string, subject: string, text: string, html?: string) => {
  const msg = {
    to,
    from: 'dmartinezenfocado@gmail.com',
    subject,
    text,
    html,
  };

  try {
    await sgMail.send(msg);
    console.log('Email enviado a', to);
  } catch (error: any) {
    console.error('Error al enviar email:', error.response?.body || error.message);
    throw error;
  }
};
