"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
const config_1 = require("../config");
let transporter = null;
function getMailFrom() {
    if (config_1.env.mail.forceFromSmtpUser && config_1.env.mail.user) {
        return config_1.env.mail.user;
    }
    return config_1.env.mail.from;
}
function getTransporter() {
    if (transporter)
        return transporter;
    const { host, user, pass } = config_1.env.mail;
    if (!host) {
        if (config_1.env.nodeEnv !== 'test') {
            console.warn('[Mail] SMTP_HOST is empty — set it in backend .env (see .env.example).');
        }
        return null;
    }
    if (!user || !pass) {
        if (config_1.env.nodeEnv !== 'test') {
            console.warn('[Mail] SMTP_USER or SMTP_PASS is empty — emails will not send.');
        }
        return null;
    }
    transporter = nodemailer_1.default.createTransport({
        host,
        port: config_1.env.mail.port,
        secure: config_1.env.mail.secure,
        auth: { user, pass },
        connectionTimeout: 30_000,
        greetingTimeout: 30_000,
        tls: {
            rejectUnauthorized: config_1.env.mail.tlsRejectUnauthorized,
        },
    });
    return transporter;
}
async function sendEmail(options) {
    const transport = getTransporter();
    if (!transport) {
        if (config_1.env.nodeEnv === 'development') {
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
        if (config_1.env.nodeEnv === 'development') {
            //  console.log('[Mail] Sent OK:', options.subject, '→', options.to);
        }
        return true;
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[Mail] Send failed:', msg);
        if (err instanceof Error && err.stack)
            console.error(err.stack);
        return false;
    }
}
//# sourceMappingURL=emailHelpers.js.map