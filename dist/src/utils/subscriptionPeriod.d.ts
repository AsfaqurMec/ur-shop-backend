/**
 * Derive subscription length (in days) from order line summary text (e.g. "3 month", "1 year").
 * Used when activating subscription_manual after fulfillment.
 */
export declare const SUBSCRIPTION_DEFAULT_PERIOD_DAYS = 90;
export declare function subscriptionPeriodDaysFromOrderItem(item: {
    purchase_selections_summary?: Array<{
        label: string;
        value: string;
    }> | null;
}): number;
//# sourceMappingURL=subscriptionPeriod.d.ts.map