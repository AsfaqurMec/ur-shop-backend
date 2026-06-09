export interface SubscriptionActivatedData {
    orderNumber: string;
    productName: string;
    /** Variation / extras under the product name in the body (not in the email subject). */
    productDetailLines?: Array<{
        label: string;
        value: string;
    }>;
    periodEnd?: string;
    dashboardUrl?: string;
}
export declare function renderSubscriptionActivated(data: SubscriptionActivatedData): {
    subject: string;
    html: string;
    text: string;
};
//# sourceMappingURL=subscriptionActivated.d.ts.map