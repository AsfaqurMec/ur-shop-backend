/**
 * Template registry. Each template exports render(data) => { subject, html, text }.
 */

import { renderWelcome, type WelcomeData } from './welcome';
import { renderVerifyEmail, type VerifyEmailData } from './verifyEmail';
import { renderPasswordReset, type PasswordResetData } from './passwordReset';
import { renderOrderPlaced, type OrderPlacedData } from './orderPlaced';
import { renderAdminNewOrder, type AdminNewOrderData } from './adminNewOrder';
import { renderPaymentReceived, type PaymentReceivedData } from './paymentReceived';
import { renderPaymentApproved, type PaymentApprovedData } from './paymentApproved';
import { renderPaymentRejected, type PaymentRejectedData } from './paymentRejected';
import { renderDeliveryCompleted, type DeliveryCompletedData } from './deliveryCompleted';
import { renderDownloadAvailable, type DownloadAvailableData } from './downloadAvailable';
import { renderLicenseDelivered, type LicenseDeliveredData } from './licenseDelivered';
import { renderSubscriptionActivated, type SubscriptionActivatedData } from './subscriptionActivated';
import {
  renderSubscriptionExpiringSoon,
  type SubscriptionExpiringSoonData,
} from './subscriptionExpiringSoon';
import { renderTicketReply, type TicketReplyData } from './ticketReply';
import { renderPasswordChanged, type PasswordChangedData } from './passwordChanged';
import { renderAdminTicketNotify, type AdminTicketNotifyData } from './adminTicketNotify';

export type TemplateName =
  | 'welcome'
  | 'verify-email'
  | 'password-reset'
  | 'password-changed'
  | 'admin-new-order'
  | 'admin-ticket-notify'
  | 'order-placed'
  | 'payment-received'
  | 'payment-approved'
  | 'payment-rejected'
  | 'delivery-completed'
  | 'download-available'
  | 'license-delivered'
  | 'subscription-activated'
  | 'subscription-expiring-soon'
  | 'ticket-reply';

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

const registry: Record<TemplateName, (data: unknown) => RenderedEmail> = {
  welcome: renderWelcome as (data: unknown) => RenderedEmail,
  'verify-email': renderVerifyEmail as (data: unknown) => RenderedEmail,
  'password-reset': renderPasswordReset as (data: unknown) => RenderedEmail,
  'password-changed': renderPasswordChanged as (data: unknown) => RenderedEmail,
  'admin-new-order': renderAdminNewOrder as (data: unknown) => RenderedEmail,
  'admin-ticket-notify': renderAdminTicketNotify as (data: unknown) => RenderedEmail,
  'order-placed': renderOrderPlaced as (data: unknown) => RenderedEmail,
  'payment-received': renderPaymentReceived as (data: unknown) => RenderedEmail,
  'payment-approved': renderPaymentApproved as (data: unknown) => RenderedEmail,
  'payment-rejected': renderPaymentRejected as (data: unknown) => RenderedEmail,
  'delivery-completed': renderDeliveryCompleted as (data: unknown) => RenderedEmail,
  'download-available': renderDownloadAvailable as (data: unknown) => RenderedEmail,
  'license-delivered': renderLicenseDelivered as (data: unknown) => RenderedEmail,
  'subscription-activated': renderSubscriptionActivated as (data: unknown) => RenderedEmail,
  'subscription-expiring-soon': renderSubscriptionExpiringSoon as (data: unknown) => RenderedEmail,
  'ticket-reply': renderTicketReply as (data: unknown) => RenderedEmail,
};

export function getTemplate(name: TemplateName): (data: unknown) => RenderedEmail {
  const fn = registry[name];
  if (!fn) throw new Error(`Unknown email template: ${name}`);
  return fn;
}

export function renderTemplate<T extends TemplateName>(name: T, data: TemplateDataMap[T]): RenderedEmail {
  return getTemplate(name)(data);
}
