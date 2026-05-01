import nodemailer from "nodemailer";
// Note: renderTemplate is imported but not used in this file
// It's available for template rendering in other modules

/**
 * Email service configuration
 * Supports both SMTP and SendGrid providers
 */

export interface EmailConfig {
  provider: "smtp" | "sendgrid";
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  sendgrid?: {
    apiKey: string;
  };
  from: string;
  fromName?: string;
}

export interface EmailOptions {
  to: string;
  subject: string;
  htmlBody: string;
  plainTextBody?: string;
  replyTo?: string;
}

/**
 * Initialize email service based on environment variables
 */
export function initializeEmailService(): EmailConfig {
  const provider = (process.env.EMAIL_PROVIDER || "smtp") as "smtp" | "sendgrid";

  if (provider === "sendgrid") {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      throw new Error("SENDGRID_API_KEY environment variable is required");
    }
    return {
      provider: "sendgrid",
      sendgrid: { apiKey },
      from: process.env.EMAIL_FROM || "noreply@openclaw.dev",
      fromName: process.env.EMAIL_FROM_NAME || "OpenClaw Mission Control",
    };
  }

  // Default to SMTP
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587");
  const secure = process.env.SMTP_SECURE === "true";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error("SMTP configuration is incomplete. Please set SMTP_HOST, SMTP_USER, and SMTP_PASS");
  }

  return {
    provider: "smtp",
    smtp: { host, port, secure, auth: { user, pass } },
    from: process.env.EMAIL_FROM || "noreply@openclaw.dev",
    fromName: process.env.EMAIL_FROM_NAME || "OpenClaw Mission Control",
  };
}

/**
 * Send email using configured provider
 */
export async function sendEmail(config: EmailConfig, options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (config.provider === "sendgrid") {
      return await sendViaSendGrid(config, options);
    } else {
      return await sendViaSMTP(config, options);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[Email Service] Error sending email:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Send email via SendGrid
 */
async function sendViaSendGrid(config: EmailConfig, options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!config.sendgrid) {
    return { success: false, error: "SendGrid configuration not found" };
  }

  try {
    const sgMail = require("@sendgrid/mail");
    sgMail.setApiKey(config.sendgrid.apiKey);

    const msg = {
      to: options.to,
      from: `${config.fromName} <${config.from}>`,
      subject: options.subject,
      html: options.htmlBody,
      text: options.plainTextBody || stripHtml(options.htmlBody),
      replyTo: options.replyTo,
    };

    const response = await sgMail.send(msg);
    return {
      success: true,
      messageId: response[0]?.headers?.["x-message-id"],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "SendGrid error";
    return { success: false, error: errorMessage };
  }
}

/**
 * Send email via SMTP
 */
async function sendViaSMTP(config: EmailConfig, options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!config.smtp) {
    return { success: false, error: "SMTP configuration not found" };
  }

  const transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: config.smtp.auth,
  });

  try {
    const info = await transporter.sendMail({
      from: `${config.fromName} <${config.from}>`,
      to: options.to,
      subject: options.subject,
      html: options.htmlBody,
      text: options.plainTextBody || stripHtml(options.htmlBody),
      replyTo: options.replyTo,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "SMTP error";
    return { success: false, error: errorMessage };
  }
}

/**
 * Strip HTML tags from content for plain text version
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .trim();
}

/**
 * Verify email configuration
 */
export async function verifyEmailConfiguration(config: EmailConfig): Promise<{ valid: boolean; error?: string }> {
  try {
    if (config.provider === "sendgrid") {
      if (!config.sendgrid?.apiKey) {
        return { valid: false, error: "SendGrid API key not configured" };
      }
      // Basic validation - SendGrid API key format
      if (!config.sendgrid.apiKey.startsWith("SG.")) {
        return { valid: false, error: "Invalid SendGrid API key format" };
      }
      return { valid: true };
    } else {
      if (!config.smtp) {
        return { valid: false, error: "SMTP configuration not found" };
      }

      const transporter = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.secure,
        auth: config.smtp.auth,
      });

      await transporter.verify();
      return { valid: true };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Configuration verification failed";
    return { valid: false, error: errorMessage };
  }
}

/**
 * Send test email to verify configuration
 */
export async function sendTestEmail(config: EmailConfig, testEmail: string): Promise<{ success: boolean; error?: string }> {
  const result = await sendEmail(config, {
    to: testEmail,
    subject: "OpenClaw Mission Control - Email Configuration Test",
    htmlBody: `
      <h1>Email Configuration Test</h1>
      <p>This is a test email to verify your email configuration is working correctly.</p>
      <p>If you received this email, your email service is properly configured.</p>
      <hr>
      <p><small>Sent at: ${new Date().toISOString()}</small></p>
    `,
    plainTextBody: `
      Email Configuration Test

      This is a test email to verify your email configuration is working correctly.
      If you received this email, your email service is properly configured.

      Sent at: ${new Date().toISOString()}
    `,
  });

  return {
    success: result.success,
    error: result.error,
  };
}

/**
 * Format email address for display
 */
export function formatEmailAddress(email: string, name?: string): string {
  if (name) {
    return `${name} <${email}>`;
  }
  return email;
}

/**
 * Validate email address format
 */
export function validateEmailAddress(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
