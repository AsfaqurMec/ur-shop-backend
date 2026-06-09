export interface PaymentReceivedData {
    orderNumber: string;
    amount: string;
    currency: string;
}
export declare function renderPaymentReceived(data: PaymentReceivedData): {
    subject: string;
    html: string;
    text: string;
};
//# sourceMappingURL=paymentReceived.d.ts.map