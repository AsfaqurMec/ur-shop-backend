"use strict";
/**
 * Email service: template rendering + send via nodemailer + email_logs.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTemplateEmail = sendTemplateEmail;
exports.sendWelcomeEmail = sendWelcomeEmail;
exports.sendVerifyEmail = sendVerifyEmail;
exports.sendPasswordResetEmail = sendPasswordResetEmail;
exports.sendPasswordChangedEmail = sendPasswordChangedEmail;
exports.sendOrderPlacedEmail = sendOrderPlacedEmail;
exports.sendAdminNewOrderEmail = sendAdminNewOrderEmail;
exports.sendAdminTicketNotifyEmail = sendAdminTicketNotifyEmail;
exports.sendPaymentReceivedEmail = sendPaymentReceivedEmail;
exports.sendPaymentApprovedEmail = sendPaymentApprovedEmail;
exports.sendPaymentRejectedEmail = sendPaymentRejectedEmail;
exports.sendDeliveryCompletedEmail = sendDeliveryCompletedEmail;
exports.sendDownloadAvailableEmail = sendDownloadAvailableEmail;
exports.sendLicenseDeliveredEmail = sendLicenseDeliveredEmail;
exports.sendSubscriptionActivatedEmail = sendSubscriptionActivatedEmail;
exports.sendSubscriptionExpiringSoonEmail = sendSubscriptionExpiringSoonEmail;
exports.sendTicketReplyEmail = sendTicketReplyEmail;
const emailHelpers_1 = require("../utils/emailHelpers");
const emailLogRepo = __importStar(require("../repositories/emailLogRepository"));
const templates_1 = require("../email/templates");
/**
 * Send an email using a named template. Renders template, sends via transport, and logs to email_logs.
 */
async function sendTemplateEmail(templateName, to, data, options) {
    let rendered;
    try {
        rendered = (0, templates_1.renderTemplate)(templateName, data);
    }
    catch (err) {
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
    const sent = await (0, emailHelpers_1.sendEmail)({
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
async function sendWelcomeEmail(to, data) {
    return sendTemplateEmail('welcome', to, data);
}
async function sendVerifyEmail(to, data) {
    return sendTemplateEmail('verify-email', to, data);
}
async function sendPasswordResetEmail(to, data) {
    return sendTemplateEmail('password-reset', to, data);
}
async function sendPasswordChangedEmail(to, data) {
    return sendTemplateEmail('password-changed', to, data);
}
async function sendOrderPlacedEmail(to, data) {
    return sendTemplateEmail('order-placed', to, data);
}
async function sendAdminNewOrderEmail(to, data) {
    return sendTemplateEmail('admin-new-order', to, data);
}
async function sendAdminTicketNotifyEmail(to, data) {
    return sendTemplateEmail('admin-ticket-notify', to, data);
}
async function sendPaymentReceivedEmail(to, data) {
    return sendTemplateEmail('payment-received', to, data);
}
async function sendPaymentApprovedEmail(to, data, options) {
    return sendTemplateEmail('payment-approved', to, data, options);
}
async function sendPaymentRejectedEmail(to, data) {
    return sendTemplateEmail('payment-rejected', to, data);
}
async function sendDeliveryCompletedEmail(to, data) {
    return sendTemplateEmail('delivery-completed', to, data);
}
async function sendDownloadAvailableEmail(to, data) {
    return sendTemplateEmail('download-available', to, data);
}
async function sendLicenseDeliveredEmail(to, data) {
    return sendTemplateEmail('license-delivered', to, data);
}
async function sendSubscriptionActivatedEmail(to, data) {
    return sendTemplateEmail('subscription-activated', to, data);
}
async function sendSubscriptionExpiringSoonEmail(to, data) {
    return sendTemplateEmail('subscription-expiring-soon', to, data);
}
async function sendTicketReplyEmail(to, data) {
    return sendTemplateEmail('ticket-reply', to, data);
}
//# sourceMappingURL=emailService.js.map