/** Creates a customer-owned or admin printable invoice. Amounts are taken only from the stored order. */
export declare function createInvoicePdf(userId: number | null, orderId: number, isAdmin?: boolean): Promise<{
    filename: string;
    buffer: Buffer;
}>;
//# sourceMappingURL=invoiceService.d.ts.map