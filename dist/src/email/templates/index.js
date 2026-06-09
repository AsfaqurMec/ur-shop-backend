"use strict";
/**
 * Template registry. Each template exports render(data) => { subject, html, text }.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTemplate = getTemplate;
exports.renderTemplate = renderTemplate;
const welcome_1 = require("./welcome");
const verifyEmail_1 = require("./verifyEmail");
const passwordReset_1 = require("./passwordReset");
const orderPlaced_1 = require("./orderPlaced");
const adminNewOrder_1 = require("./adminNewOrder");
const paymentReceived_1 = require("./paymentReceived");
const paymentApproved_1 = require("./paymentApproved");
const paymentRejected_1 = require("./paymentRejected");
const deliveryCompleted_1 = require("./deliveryCompleted");
const downloadAvailable_1 = require("./downloadAvailable");
const licenseDelivered_1 = require("./licenseDelivered");
const subscriptionActivated_1 = require("./subscriptionActivated");
const subscriptionExpiringSoon_1 = require("./subscriptionExpiringSoon");
const ticketReply_1 = require("./ticketReply");
const passwordChanged_1 = require("./passwordChanged");
const adminTicketNotify_1 = require("./adminTicketNotify");
const registry = {
    welcome: welcome_1.renderWelcome,
    'verify-email': verifyEmail_1.renderVerifyEmail,
    'password-reset': passwordReset_1.renderPasswordReset,
    'password-changed': passwordChanged_1.renderPasswordChanged,
    'admin-new-order': adminNewOrder_1.renderAdminNewOrder,
    'admin-ticket-notify': adminTicketNotify_1.renderAdminTicketNotify,
    'order-placed': orderPlaced_1.renderOrderPlaced,
    'payment-received': paymentReceived_1.renderPaymentReceived,
    'payment-approved': paymentApproved_1.renderPaymentApproved,
    'payment-rejected': paymentRejected_1.renderPaymentRejected,
    'delivery-completed': deliveryCompleted_1.renderDeliveryCompleted,
    'download-available': downloadAvailable_1.renderDownloadAvailable,
    'license-delivered': licenseDelivered_1.renderLicenseDelivered,
    'subscription-activated': subscriptionActivated_1.renderSubscriptionActivated,
    'subscription-expiring-soon': subscriptionExpiringSoon_1.renderSubscriptionExpiringSoon,
    'ticket-reply': ticketReply_1.renderTicketReply,
};
function getTemplate(name) {
    const fn = registry[name];
    if (!fn)
        throw new Error(`Unknown email template: ${name}`);
    return fn;
}
function renderTemplate(name, data) {
    return getTemplate(name)(data);
}
//# sourceMappingURL=index.js.map