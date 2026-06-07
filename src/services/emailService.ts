/**
 * Email service: template rendering + send via nodemailer + email_logs.
 */

import type { Attachment } from 'nodemailer/lib/mailer';
import { sendEmail } from '../utils/emailHelpers';
import * as emailLogRepo from '../repositories/emailLogRepository';
import {
  renderTemplate,
  type TemplateName,
  type TemplateDataMap,
  type RenderedEmail,
} from '../email/templates';

export type { TemplateName, TemplateDataMap, RenderedEmail };

/**
 * Send an email using a named template. Renders template, sends via transport, and logs to email_logs.
 */
export async function sendTemplateEmail<T extends TemplateName>(
  templateName: T,
  to: string,
  data: TemplateDataMap[T],
  options?: { attachments?: Attachment[] }
): Promise<{ sent: boolean; error?: string }> {
  let rendered: RenderedEmail;
  try {
    rendered = renderTemplate(templateName, data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Template render failed';
    await emailLogRepo.create({
      to_email: to,
      subject: null,
      template: templateName,
      status: 'failed',
      error_message: message,
    });
    return { sent: false, error: message };
  }

  const sent = await sendEmail({
    to,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    attachments: options?.attachments,
  });

  await emailLogRepo.create({
    to_email: to,
    subject: rendered.subject,
    template: templateName,
    status: sent ? 'sent' : 'failed',
    error_message: sent ? null : 'Send failed (check transport/logs)',
  });

  if (!sent) {
    return { sent: false, error: 'Send failed' };
  }
  return { sent: true };
}

// Convenience methods for each template (typed data)

export async function sendWelcomeEmail(to: string, data: TemplateDataMap['welcome']) {
  return sendTemplateEmail('welcome', to, data);
}

export async function sendVerifyEmail(to: string, data: TemplateDataMap['verify-email']) {
  return sendTemplateEmail('verify-email', to, data);
}

export async function sendPasswordResetEmail(to: string, data: TemplateDataMap['password-reset']) {
  return sendTemplateEmail('password-reset', to, data);
}

export async function sendPasswordChangedEmail(to: string, data: TemplateDataMap['password-changed']) {
  return sendTemplateEmail('password-changed', to, data);
}

export async function sendOrderPlacedEmail(to: string, data: TemplateDataMap['order-placed']) {
  return sendTemplateEmail('order-placed', to, data);
}

export async function sendAdminNewOrderEmail(to: string, data: TemplateDataMap['admin-new-order']) {
  return sendTemplateEmail('admin-new-order', to, data);
}

export async function sendAdminTicketNotifyEmail(to: string, data: TemplateDataMap['admin-ticket-notify']) {
  return sendTemplateEmail('admin-ticket-notify', to, data);
}

export async function sendPaymentReceivedEmail(to: string, data: TemplateDataMap['payment-received']) {
  return sendTemplateEmail('payment-received', to, data);
}

export async function sendPaymentApprovedEmail(
  to: string,
  data: TemplateDataMap['payment-approved'],
  options?: { attachments?: Attachment[] }
) {
  return sendTemplateEmail('payment-approved', to, data, options);
}

export async function sendPaymentRejectedEmail(to: string, data: TemplateDataMap['payment-rejected']) {
  return sendTemplateEmail('payment-rejected', to, data);
}

export async function sendDeliveryCompletedEmail(to: string, data: TemplateDataMap['delivery-completed']) {
  return sendTemplateEmail('delivery-completed', to, data);
}

export async function sendDownloadAvailableEmail(to: string, data: TemplateDataMap['download-available']) {
  return sendTemplateEmail('download-available', to, data);
}

export async function sendLicenseDeliveredEmail(to: string, data: TemplateDataMap['license-delivered']) {
  return sendTemplateEmail('license-delivered', to, data);
}

export async function sendSubscriptionActivatedEmail(to: string, data: TemplateDataMap['subscription-activated']) {
  return sendTemplateEmail('subscription-activated', to, data);
}

export async function sendSubscriptionExpiringSoonEmail(
  to: string,
  data: TemplateDataMap['subscription-expiring-soon']
) {
  return sendTemplateEmail('subscription-expiring-soon', to, data);
}

export async function sendTicketReplyEmail(to: string, data: TemplateDataMap['ticket-reply']) {
  return sendTemplateEmail('ticket-reply', to, data);
}
