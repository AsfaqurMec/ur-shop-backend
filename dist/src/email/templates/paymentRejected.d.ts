export interface PaymentRejectedData {
    orderNumber: string;
    reason?: string;
}
export declare function renderPaymentRejected(data: PaymentRejectedData): {
    subject: string;
    html: string;
    text: string;
};
//# sourceMappingURL=paymentRejected.d.ts.map