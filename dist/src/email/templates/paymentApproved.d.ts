export interface PaymentApprovedLine {
    product_name: string;
    detail_lines?: Array<{
        label: string;
        value: string;
    }>;
    quantity: number;
    product_type: string;
}
export interface PaymentApprovedLicenseGroup {
    product_name: string;
    detail_lines?: Array<{
        label: string;
        value: string;
    }>;
    keys: string[];
}
export interface PaymentApprovedData {
    orderNumber: string;
    customerName?: string;
    total?: string;
    currency?: string;
    lines?: PaymentApprovedLine[];
    licenseGroups?: PaymentApprovedLicenseGroup[];
    filesAttached?: boolean;
    fulfillmentNote?: string;
    dashboardUrl?: string;
}
export declare function renderPaymentApproved(data: PaymentApprovedData): {
    subject: string;
    html: string;
    text: string;
};
//# sourceMappingURL=paymentApproved.d.ts.map