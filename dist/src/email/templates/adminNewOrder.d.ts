export interface AdminNewOrderLine {
    product_name: string;
    detail_lines?: Array<{
        label: string;
        value: string;
    }>;
    quantity: number;
    product_type: string;
    line_total: string;
}
export interface AdminNewOrderData {
    orderNumber: string;
    customerEmail: string;
    customerName: string;
    total: string;
    currency: string;
    subtotal?: string;
    discount?: string;
    lines: AdminNewOrderLine[];
    adminOrdersUrl?: string;
}
export declare function renderAdminNewOrder(data: AdminNewOrderData): {
    subject: string;
    html: string;
    text: string;
};
//# sourceMappingURL=adminNewOrder.d.ts.map