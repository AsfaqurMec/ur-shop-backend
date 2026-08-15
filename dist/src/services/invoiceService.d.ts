/** Creates a customer-owned, printable invoice. Amounts are taken only from the stored order. */
export declare function createInvoicePdf(userId: number, orderId: number): Promise<{
    filename: string;
    buffer: Buffer;
}>;
//# sourceMappingURL=invoiceService.d.ts.map