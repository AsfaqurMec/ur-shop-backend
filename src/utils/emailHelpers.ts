import nodemailer from 'nodemailer';
import type { Attachment } from 'nodemailer/lib/mailer';
import { env } from '../config';

let transporter: nodemailer.Transporter | null = null;

function getMailFrom(): string {
  if (env.mail.forceFromSmtpUser && env.mail.user) {
    return env.mail.user;
  }
  return env.mail.from;
}

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;
  const { host, user, pass } = env.mail;
  if (!host) {
    if (env.nodeEnv !== 'test') {
      console.warn('[Mail] SMTP_HOST is empty — set it in backend .env (see .env.example).');
    }
    return null;
  }
  if (!user || !pass) {
    if (env.nodeEnv !== 'test') {
      console.warn('[Mail] SMTP_USER or SMTP_PASS is empty — emails will not send.');
    }
    return null;
  }
  transporter = nodemailer.createTransport({
    host,
    port: env.mail.port,
    secure: env.mail.secure,
    auth: { user, pass },
    connectionTimeout: 30_000,
    greetingTimeout: 30_000,
    tls: {
      rejectUnauthorized: env.mail.tlsRejectUnauthorized,
    },
  });
  return transporter;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Attachment[];
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  const transport = getTransporter();
  if (!transport) {
    if (env.nodeEnv === 'development') {
      const att = options.attachments?.length ? ` (+${options.attachments.length} attachment(s))` : '';
      //  console.log('[Mail] Not configured. Would send:', options.subject, 'to', options.to, att);
    }
    return false;
  }
  const from = getMailFrom();
  try {
    await transport.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      attachments: options.attachments,
    });
    if (env.nodeEnv === 'development') {
      //  console.log('[Mail] Sent OK:', options.subject, '→', options.to);
    }
    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Mail] Send failed:', msg);
    if (err instanceof Error && err.stack) console.error(err.stack);
    return false;
  }
}
