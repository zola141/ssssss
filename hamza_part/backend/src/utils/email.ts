import nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: options.to,
      subject: options.subject,
      html: options.html,
    };
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

export const sendDataRequestConfirmation = async (
  userEmail: string,
  userName: string
): Promise<void> => {
  const html = `
    <h1>Data Request Received</h1>
    <p>Dear ${userName},</p>
    <p>Your request to access your personal data has been received and is being processed.</p>
    <p>You will receive your data export within 24 hours.</p>
    <p>Best regards,<br/>Transcendence Team</p>
  `;

  await sendEmail({
    to: userEmail,
    subject: 'Data Request Confirmation - Transcendence',
    html,
  });
};

export const sendAccountDeletionConfirmation = async (
  userEmail: string,
  userName: string
): Promise<void> => {
  const html = `
    <h1>Account Deletion Confirmation</h1>
    <p>Dear ${userName},</p>
    <p>Your account and all associated data have been successfully deleted.</p>
    <p>We're sorry to see you go!</p>
    <p>Best regards,<br/>Transcendence Team</p>
  `;

  await sendEmail({
    to: userEmail,
    subject: 'Account Deletion Confirmation - Transcendence',
    html,
  });
};

export const sendDataExportNotification = async (
  userEmail: string,
  userName: string
): Promise<void> => {
  const html = `
    <h1>Your Data Export is Ready</h1>
    <p>Dear ${userName},</p>
    <p>Your personal data export is now ready for download. It includes:</p>
    <ul>
      <li>Profile information</li>
      <li>Match history</li>
      <li>Game statistics</li>
      <li>Activity logs</li>
    </ul>
    <p>The file will be available for 30 days.</p>
    <p>Best regards,<br/>Transcendence Team</p>
  `;

  await sendEmail({
    to: userEmail,
    subject: 'Your Data Export is Ready - Transcendence',
    html,
  });
};
