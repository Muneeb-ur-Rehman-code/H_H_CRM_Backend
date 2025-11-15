import nodemailer, { Transporter } from 'nodemailer';
import { IUser } from '../types/user.types';

class EmailService {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  private async sendMail(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to,
        subject,
        html
      });
      console.log(`📧 Email sent to ${to}`);
    } catch (error) {
      console.error('❌ Email sending error:', error);
      throw error;
    }
  }

  async sendPasswordSetupEmail(user: IUser, token: string): Promise<void> {
    const setupUrl = `${process.env.CLIENT_URL}/set-password?token=${token}`;
    const subject = 'Complete Your Registration - Visa Consultancy';
    const html = `
      <h2>Hello ${user.name}!</h2>
      <p>Your visa application has been approved by our consultant.</p>
      <p>Please click the link below to set your password and access your dashboard:</p>
      <a href="${setupUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Set Password</a>
      <p>Or copy this link: ${setupUrl}</p>
      <p>This link will expire in 24 hours.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `;

    await this.sendMail(user.email, subject, html);
  }

  async sendStaffCredentials(data: {
    email: string;
    name: string;
    tempPassword: string;
    role: string;
  }): Promise<void> {
    const subject = 'Your CRM Account Has Been Created';
    const html = `
      <h2>Welcome ${data.name}!</h2>
      <p>Your CRM account has been created with the following details:</p>
      <p><strong>Email:</strong> ${data.email}</p>
      <p><strong>Temporary Password:</strong> ${data.tempPassword}</p>
      <p><strong>Role:</strong> ${data.role}</p>
      <p>Please login at: ${process.env.CRM_URL}/login</p>
      <p>You will be prompted to change your password on first login.</p>
    `;

    await this.sendMail(data.email, subject, html);
  }
}

export default new EmailService();