/**
 * Email service: template rendering + send via nodemailer + email_logs.
 */
import type { Attachment } from 'nodemailer/lib/mailer';
import { type TemplateName, type TemplateDataMap, type RenderedEmail } from '../email/templates';
export type { TemplateName, TemplateDataMap, RenderedEmail };
/**
 * Send an email using a named template. Renders template, sends via transport, and logs to email_logs.
 */
export declare function sendTemplateEmail<T extends TemplateName>(templateName: T, to: string, data: TemplateDataMap[T], options?: {
    attachments?: Attachment[];
}): Promise<{
    sent: boolean;
    error?: string;
}>;
export declare function sendWelcomeEmail(to: string, data: TemplateDataMap['welcome']): Promise<{
    sent: boolean;
    error?: string;
}>;
export declare function sendVerifyEmail(to: string, data: TemplateDataMap['verify-email']): Promise<{
    sent: boolean;
    error?: string;
}>;
export declare function sendPasswordResetEmail(to: string, data: TemplateDataMap['password-reset']): Promise<{
    sent: boolean;
    error?: string;
}>;
export declare function sendPasswordChangedEmail(to: string, data: TemplateDataMap['password-changed']): Promise<{
    sent: boolean;
    error?: string;
}>;
export declare function sendOrderPlacedEmail(to: string, data: TemplateDataMap['order-placed']): Promise<{
    sent: boolean;
    error?: string;
}>;
export declare function sendAdminNewOrderEmail(to: string, data: TemplateDataMap['admin-new-order']): Promise<{
    sent: boolean;
    error?: string;
}>;
export declare function sendAdminTicketNotifyEmail(to: string, data: TemplateDataMap['admin-ticket-notify']): Promise<{
    sent: boolean;
    error?: string;
}>;
export declare function sendPaymentReceivedEmail(to: string, data: TemplateDataMap['payment-received']): Promise<{
    sent: boolean;
    error?: string;
}>;
export declare function sendPaymentApprovedEmail(to: string, data: TemplateDataMap['payment-approved'], options?: {
    attachments?: Attachment[];
}): Promise<{
    sent: boolean;
    error?: string;
}>;
export declare function sendPaymentRejectedEmail(to: string, data: TemplateDataMap['payment-rejected']): Promise<{
    sent: boolean;
    error?: string;
}>;
export declare function sendDeliveryCompletedEmail(to: string, data: TemplateDataMap['delivery-completed']): Promise<{
    sent: boolean;
    error?: string;
}>;
export declare function sendDownloadAvailableEmail(to: string, data: TemplateDataMap['download-available']): Promise<{
    sent: boolean;
    error?: string;
}>;
export declare function sendLicenseDeliveredEmail(to: string, data: TemplateDataMap['license-delivered']): Promise<{
    sent: boolean;
    error?: string;
}>;
export declare function sendSubscriptionActivatedEmail(to: string, data: TemplateDataMap['subscription-activated']): Promise<{
    sent: boolean;
    error?: string;
}>;
export declare function sendSubscriptionExpiringSoonEmail(to: string, data: TemplateDataMap['subscription-expiring-soon']): Promise<{
    sent: boolean;
    error?: string;
}>;
export declare function sendTicketReplyEmail(to: string, data: TemplateDataMap['ticket-reply']): Promise<{
    sent: boolean;
    error?: string;
}>;
//# sourceMappingURL=emailService.d.ts.map