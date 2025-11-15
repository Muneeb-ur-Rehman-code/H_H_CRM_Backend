import nodemailer, { Transporter } from 'nodemailer';
import config from '../config/config';
import { UserRole } from '../types/user.types';

class EmailService {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: false,
      auth: {
        user: config.email.user,
        pass: config.email.pass
      }
    });
  }

  /**
   * Send OTP Email
   */
  async sendOTPEmail(email: string, otp: string): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #4CAF50; text-align: center;">Verify Your Email</h2>
        <p style="color: #333; font-size: 16px;">Your verification code is:</p>
        <div style="background: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
          <h1 style="color: #333; letter-spacing: 5px; margin: 0; font-size: 36px;">${otp}</h1>
        </div>
        <p style="color: #666;">This code will expire in 10 minutes.</p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">If you didn't request this code, please ignore this email.</p>
      </div>
    `;

    await this.sendMail(email, 'Email Verification Code', html);
  }

  /**
   * Send Staff Setup Email (Admin Created)
   */
  async sendStaffSetupEmail(
    email: string, 
    name: string,
    setupToken: string,
    role: UserRole
  ): Promise<void> {
    const setupUrl = `${config.urls.crmUrl}/setup-account?token=${setupToken}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #4CAF50;">Welcome to Visa Consultancy CRM</h2>
        <p>Dear ${name},</p>
        <p>Your ${role} account has been created by the administrator.</p>
        <p>Please click the button below to set your password and complete your account setup:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${setupUrl}" style="background: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Set Your Password
          </a>
        </div>
        <p style="color: #666;">Or copy this link: <br/><span style="color: #333;">${setupUrl}</span></p>
        <p style="color: #999;">This link will expire in 48 hours.</p>
      </div>
    `;

    await this.sendMail(email, 'Complete Your Account Setup - Visa Consultancy', html);
  }

  /**
   * Send Staff Approval Email (After Self-Registration)
   */
  async sendStaffApprovalEmail(
    email: string, 
    name: string,
    setupToken: string
  ): Promise<void> {
    const setupUrl = `${config.urls.crmUrl}/setup-account?token=${setupToken}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #4CAF50;">Registration Approved!</h2>
        <p>Dear ${name},</p>
        <p>Great news! Your registration request has been approved by the administrator.</p>
        <p>Please click the button below to set your password and activate your account:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${setupUrl}" style="background: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Set Your Password
          </a>
        </div>
        <p style="color: #666;">Or copy this link: <br/><span style="color: #333;">${setupUrl}</span></p>
        <p style="color: #999;">This link will expire in 48 hours.</p>
      </div>
    `;

    await this.sendMail(email, 'Registration Approved - Set Your Password', html);
  }

  /**
   * Send Staff Rejection Email
   */
  async sendStaffRejectionEmail(
    email: string,
    name: string,
    reason: string
  ): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #f44336;">Registration Not Approved</h2>
        <p>Dear ${name},</p>
        <p>We regret to inform you that your registration request has not been approved.</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
        <p>If you have any questions, please contact the administrator.</p>
      </div>
    `;

    await this.sendMail(email, 'Registration Status Update', html);
  }

  /**
   * Send Student Approval Email (Consultant Approved)
   */
  async sendStudentApprovalEmail(
    email: string,
    name: string,
    setupToken: string
  ): Promise<void> {
    const setupUrl = `${config.urls.clientUrl}/setup-account?token=${setupToken}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #4CAF50;">Your Application Has Been Approved!</h2>
        <p>Dear ${name},</p>
        <p>Congratulations! Your visa consultation application has been approved by our consultant.</p>
        <p>Please click the button below to set your password and access your student dashboard:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${setupUrl}" style="background: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Complete Registration
          </a>
        </div>
        <p style="color: #666;">Or copy this link: <br/><span style="color: #333;">${setupUrl}</span></p>
        <p style="color: #999;">This link will expire in 48 hours.</p>
        <p>Once registered, you can track your visa application progress through your dashboard.</p>
      </div>
    `;

    await this.sendMail(email, 'Application Approved - Complete Your Registration', html);
  }

  /**
   * Send Admin Notification
   */
  async sendAdminNotification(
    email: string,
    subject: string,
    message: string
  ): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #2196F3;">Admin Notification</h2>
        <p>${message}</p>
        <p style="margin-top: 30px;">
          <a href="${config.urls.crmUrl}/admin/dashboard" style="background: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Go to Dashboard
          </a>
        </p>
      </div>
    `;

    await this.sendMail(email, subject, html);
  }

  private async sendMail(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: config.email.from,
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
}

export default new EmailService();