"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderPaymentReceived = renderPaymentReceived;
const layout_1 = require("../layout");
function renderPaymentReceived(data) {
    const subject = `Payment received for order #${data.orderNumber}`;
    const body = (0, layout_1.paragraph)('We have received your payment proof for the order below.') + (0, layout_1.paragraph)(`Order: <strong>#${(0, layout_1.escapeHtml)(data.orderNumber)}</strong><br>Amount: ${(0, layout_1.escapeHtml)(data.amount)} ${(0, layout_1.escapeHtml)(data.currency)}`) + (0, layout_1.paragraph)('We will verify and process your order shortly. You will receive another email when your order is approved and delivery is completed.');
    const html = (0, layout_1.wrapHtml)(subject, body);
    const text = `Payment received for order #${data.orderNumber}\n\nWe have received your payment proof. We will verify and process your order shortly.`;
    return { subject, html, text };
}
//# sourceMappingURL=paymentReceived.js.map