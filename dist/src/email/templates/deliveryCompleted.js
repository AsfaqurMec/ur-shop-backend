"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderDeliveryCompleted = renderDeliveryCompleted;
const layout_1 = require("../layout");
function renderDeliveryCompleted(data) {
    const subject = `Order #${data.orderNumber} – Delivery completed`;
    const body = (0, layout_1.paragraph)(`Your order <strong>#${(0, layout_1.escapeHtml)(data.orderNumber)}</strong> has been fulfilled.`) + (0, layout_1.paragraph)((0, layout_1.escapeHtml)(data.summary)) + (0, layout_1.paragraph)('Downloads, license keys, and subscription access are available in your dashboard.');
    const html = (0, layout_1.wrapHtml)(subject, body);
    const text = `Order #${data.orderNumber} – Delivery completed\n\n${data.summary}\n\nCheck your dashboard for downloads and licenses.`;
    return { subject, html, text };
}
//# sourceMappingURL=deliveryCompleted.js.map