"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderPaymentRejected = renderPaymentRejected;
const layout_1 = require("../layout");
function renderPaymentRejected(data) {
    const subject = `Payment issue – Order #${data.orderNumber}`;
    let body = (0, layout_1.paragraph)(`We were unable to verify your payment for order <strong>#${(0, layout_1.escapeHtml)(data.orderNumber)}</strong>.`);
    if (data.reason) {
        body += (0, layout_1.paragraph)(`Reason: ${(0, layout_1.escapeHtml)(data.reason)}`);
    }
    body += (0, layout_1.paragraph)('You can submit a new payment proof from your order page, or contact support if you need help.');
    const html = (0, layout_1.wrapHtml)(subject, body);
    let text = `Payment issue – Order #${data.orderNumber}\n\nWe were unable to verify your payment. You can submit a new payment proof from your order page.`;
    if (data.reason) {
        text += `\n\nReason: ${data.reason}`;
    }
    return { subject, html, text };
}
//# sourceMappingURL=paymentRejected.js.map