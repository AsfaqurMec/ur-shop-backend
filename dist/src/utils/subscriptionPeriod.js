"use strict";
/**
 * Derive subscription length (in days) from order line summary text (e.g. "3 month", "1 year").
 * Used when activating subscription_manual after fulfillment.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUBSCRIPTION_DEFAULT_PERIOD_DAYS = void 0;
exports.subscriptionPeriodDaysFromOrderItem = subscriptionPeriodDaysFromOrderItem;
exports.SUBSCRIPTION_DEFAULT_PERIOD_DAYS = 90;
function subscriptionPeriodDaysFromOrderItem(item) {
    const chunks = [];
    const summary = item.purchase_selections_summary;
    if (summary?.length) {
        for (const line of summary) {
            chunks.push(`${line.label} ${line.value}`);
            chunks.push(line.value);
        }
    }
    const text = chunks.join(' ').toLowerCase();
    const year = text.match(/(\d+)\s*years?/);
    if (year) {
        const n = parseInt(year[1], 10);
        if (Number.isFinite(n) && n > 0)
            return Math.min(3650, n * 365);
    }
    const month = text.match(/(\d+)\s*months?/);
    if (month) {
        const n = parseInt(month[1], 10);
        if (Number.isFinite(n) && n > 0)
            return Math.min(1200, n * 30);
    }
    const monthShort = text.match(/(\d+)\s*month\b/);
    if (monthShort) {
        const n = parseInt(monthShort[1], 10);
        if (Number.isFinite(n) && n > 0)
            return Math.min(1200, n * 30);
    }
    const day = text.match(/(\d+)\s*days?/);
    if (day) {
        const n = parseInt(day[1], 10);
        if (Number.isFinite(n) && n > 0)
            return Math.min(3650, n);
    }
    return exports.SUBSCRIPTION_DEFAULT_PERIOD_DAYS;
}
//# sourceMappingURL=subscriptionPeriod.js.map