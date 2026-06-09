export interface OrderPlacedLine {
    product_name: string;
    /** Variation / text-email options; each rendered on its own row under the product name. */
    detail_lines?: Array<{
        label: string;
        value: string;
    }>;
    quantity: number;
    line_total: string;
}
export interface OrderPlacedData {
    orderNumber: string;
    customerName?: string;
    total: string;
    currency: string;
    subtotal?: string;
    discount?: string;
    lines?: OrderPlacedLine[];
    paymentInstructions?: string;
    dashboardUrl?: string;
}
export declare function renderOrderPlaced(data: OrderPlacedData): {
    subject: string;
    html: string;
    text: string;
};
//# sourceMappingURL=orderPlaced.d.ts.map