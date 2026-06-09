"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderAdminTicketNotify = renderAdminTicketNotify;
const layout_1 = require("../layout");
function renderAdminTicketNotify(data) {
    const store = (0, layout_1.getStoreName)();
    const subject = `[${store}] ${data.eventTitle} #${data.ticketId}`;
    let body = (0, layout_1.paragraph)(`<strong>${(0, layout_1.escapeHtml)(data.eventTitle)}</strong> — Ticket #${data.ticketId}`) +
        (0, layout_1.paragraph)(`Subject: <strong>${(0, layout_1.escapeHtml)(data.subject)}</strong>`) +
        (0, layout_1.paragraph)((0, layout_1.escapeHtml)(data.excerpt));
    if (data.adminUrl) {
        body += (0, layout_1.paragraph)(`Open in admin: ${(0, layout_1.link)(data.adminUrl, 'View ticket')}`);
    }
    else {
        body += (0, layout_1.paragraph)('Review this ticket in your admin dashboard.');
    }
    const html = (0, layout_1.wrapHtml)(subject, body);
    const text = [
        subject,
        '',
        `Subject: ${data.subject}`,
        '',
        data.excerpt,
        '',
        data.adminUrl ?? '',
    ]
        .filter(Boolean)
        .join('\n');
    return { subject, html, text };
}
//# sourceMappingURL=adminTicketNotify.js.map