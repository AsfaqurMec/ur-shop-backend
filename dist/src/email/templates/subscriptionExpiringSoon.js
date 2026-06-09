"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderSubscriptionExpiringSoon = renderSubscriptionExpiringSoon;
const layout_1 = require("../layout");
function renderSubscriptionExpiringSoon(data) {
    const store = (0, layout_1.getStoreName)();
    const subject = `${store}: your subscription expires tomorrow — ${data.productName}`;
    let body = (0, layout_1.paragraph)(`Your access for <strong>${(0, layout_1.escapeHtml)(data.productName)}</strong> is set to end on <strong>${(0, layout_1.escapeHtml)(data.periodEndFormatted)}</strong> (tomorrow).`);
    body += (0, layout_1.paragraph)(`If you want to continue without interruption, please ${(0, layout_1.link)(data.renewUrl, 'renew on the product page')} before it expires.`);
    if (data.subscriptionsUrl) {
        body += (0, layout_1.paragraph)(`You can also open ${(0, layout_1.link)(data.subscriptionsUrl, 'your subscriptions')} in your account.`);
    }
    const html = (0, layout_1.wrapHtml)(subject, body);
    let text = `${subject}\n\n`;
    text += `Your subscription for ${data.productName} ends ${data.periodEndFormatted}.\n\n`;
    text += `Renew: ${data.renewUrl}\n`;
    if (data.subscriptionsUrl)
        text += `Subscriptions: ${data.subscriptionsUrl}\n`;
    return { subject, html, text };
}
//# sourceMappingURL=subscriptionExpiringSoon.js.map