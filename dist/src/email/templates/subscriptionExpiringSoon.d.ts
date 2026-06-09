export interface SubscriptionExpiringSoonData {
    productName: string;
    /** ISO end time for the current period. */
    periodEnd: string;
    /** Human-readable end (e.g. in UTC). */
    periodEndFormatted: string;
    /** Deep link to product page with renew query params. */
    renewUrl: string;
    /** Link to dashboard subscriptions list. */
    subscriptionsUrl?: string;
}
export declare function renderSubscriptionExpiringSoon(data: SubscriptionExpiringSoonData): {
    subject: string;
    html: string;
    text: string;
};
//# sourceMappingURL=subscriptionExpiringSoon.d.ts.map