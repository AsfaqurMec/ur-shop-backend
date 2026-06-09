"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderWelcome = renderWelcome;
const layout_1 = require("../layout");
function renderWelcome(data) {
    const subject = `Welcome to ${(0, layout_1.getStoreName)()}`;
    let body = (0, layout_1.paragraph)(`Hi ${(0, layout_1.escapeHtml)(data.name || 'there')},`) +
        (0, layout_1.paragraph)('Your account has been created. You can sign in and start browsing our digital products.') +
        (0, layout_1.paragraph)(`Sign in with: <strong>${(0, layout_1.escapeHtml)(data.email)}</strong>`);
    if (data.shopUrl || data.loginUrl) {
        const parts = [];
        if (data.shopUrl)
            parts.push((0, layout_1.link)(data.shopUrl, 'Browse the shop'));
        if (data.loginUrl)
            parts.push((0, layout_1.link)(data.loginUrl, 'Sign in'));
        body += (0, layout_1.paragraph)(parts.join(' · '));
    }
    const html = (0, layout_1.wrapHtml)(subject, body);
    const textLines = [
        `Welcome to ${(0, layout_1.getStoreName)()}`,
        '',
        `Hi ${data.name || 'there'},`,
        '',
        'Your account has been created. You can sign in and start browsing our digital products.',
        '',
        `Sign in with: ${data.email}`,
        '',
        data.shopUrl ? `Shop: ${data.shopUrl}` : '',
        data.loginUrl ? `Sign in: ${data.loginUrl}` : '',
    ];
    const text = textLines.filter(Boolean).join('\n');
    return { subject, html, text };
}
//# sourceMappingURL=welcome.js.map