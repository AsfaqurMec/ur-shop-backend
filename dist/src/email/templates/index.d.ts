/**
 * Template registry. Each template exports render(data) => { subject, html, text }.
 */
import { type WelcomeData } from './welcome';
import { type VerifyEmailData } from './verifyEmail';
import { type PasswordResetData } from './passwordReset';
import { type OrderPlacedData } from './orderPlaced';
import { type AdminNewOrderData } from './adminNewOrder';
import { type PaymentReceivedData } from './paymentReceived';
import { type PaymentApprovedData } from './paymentApproved';
import { type PaymentRejectedData } from './paymentRejected';
import { type DeliveryCompletedData } from './deliveryCompleted';
import { type DownloadAvailableData } from './downloadAvailable';
import { type LicenseDeliveredData } from './licenseDelivered';
import { type SubscriptionActivatedData } from './subscriptionActivated';
import { type SubscriptionExpiringSoonData } from './subscriptionExpiringSoon';
import { type TicketReplyData } from './ticketReply';
import { type PasswordChangedData } from './passwordChanged';
import { type AdminTicketNotifyData } from './adminTicketNotify';
export type TemplateName = 'welcome' | 'verify-email' | 'password-reset' | 'password-changed' | 'admin-new-order' | 'admin-ticket-notify' | 'order-placed' | 'payment-received' | 'payment-approved' | 'payment-rejected' | 'delivery-completed' | 'download-available' | 'license-delivered' | 'subscription-activated' | 'subscription-expiring-soon' | 'ticket-reply';
export type TemplateDataMap = {
    welcome: WelcomeData;
    'verify-email': VerifyEmailData;
    'password-reset': PasswordResetData;
    'password-changed': PasswordChangedData;
    'admin-new-order': AdminNewOrderData;
    'admin-ticket-notify': AdminTicketNotifyData;
    'order-placed': OrderPlacedData;
    'payment-received': PaymentReceivedData;
    'payment-approved': PaymentApprovedData;
    'payment-rejected': PaymentRejectedData;
    'delivery-completed': DeliveryCompletedData;
    'download-available': DownloadAvailableData;
    'license-delivered': LicenseDeliveredData;
    'subscription-activated': SubscriptionActivatedData;
    'subscription-expiring-soon': SubscriptionExpiringSoonData;
    'ticket-reply': TicketReplyData;
};
export interface RenderedEmail {
    subject: string;
    html: string;
    text: string;
}
export declare function getTemplate(name: TemplateName): (data: unknown) => RenderedEmail;
export declare function renderTemplate<T extends TemplateName>(name: T, data: TemplateDataMap[T]): RenderedEmail;
//# sourceMappingURL=index.d.ts.map