"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderSubscriptionActivated = renderSubscriptionActivated;
const layout_1 = require("../layout");
const orderItemCell_1 = require("../orderItemCell");
function formatPeriodEnd(iso) {
    if (!iso)
        return undefined;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime()))
        return iso;
    return d.toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'UTC',
    }) + ' UTC';
}
function renderSubscriptionActivated(data) {
    const store = (0, layout_1.getStoreName)();
    const subject = `${store}: subscription active — ${data.productName}`;
    const periodLabel = formatPeriodEnd(data.periodEnd);
    const introLead = `Your subscription (order <strong>#${(0, layout_1.escapeHtml)(data.orderNumber)}</strong>) is now active.`;
    const itemBlock = (0, orderItemCell_1.renderOrderLineItemCellHtml)(data.productName, data.productDetailLines);
    let body = `<div style="margin:0 0 14px 0"><p style="margin:0 0 10px 0">${introLead}</p>${itemBlock}</div>`;
    if (periodLabel) {
        body += (0, layout_1.paragraph)(`Current period ends: <strong>${(0, layout_1.escapeHtml)(periodLabel)}</strong>`);
    }
    if (data.dashboardUrl) {
        body += (0, layout_1.paragraph)(`Manage your subscription in your ${(0, layout_1.link)(data.dashboardUrl, 'dashboard')}.`);
    }
    else {
        body += (0, layout_1.paragraph)('You can manage your subscription in your account dashboard.');
    }
    const html = (0, layout_1.wrapHtml)(subject, body);
    const itemPlain = (0, orderItemCell_1.formatOrderLineItemPlainBlock)(data.productName, data.productDetailLines, '');
    let text = `${subject}\n\nOrder #${data.orderNumber}\n\n${itemPlain}\n\n`;
    if (periodLabel)
        text += `Current period ends: ${periodLabel}\n\n`;
    text += data.dashboardUrl
        ? `Dashboard: ${data.dashboardUrl}`
        : 'Manage your subscription in your account dashboard.';
    return { subject, html, text };
}
//# sourceMappingURL=subscriptionActivated.js.map