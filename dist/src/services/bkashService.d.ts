import type { MergedBkashConfig } from './paymentOptionService';
export declare function assertBkashConfigured(cfg: MergedBkashConfig | null): asserts cfg is MergedBkashConfig;
/** Order totals are stored in BDT; bKash charges the same amount (two decimal places). */
export declare function formatBdtAmountForCheckout(bdtTotal: number): string;
export declare function createCheckoutPayment(cfg: MergedBkashConfig, params: {
    merchantInvoiceNumber: string;
    payerReference: string;
    amountBdt: string;
}): Promise<{
    paymentID: string;
    bkashURL: string;
}>;
export declare function queryCheckoutPaymentStatus(cfg: MergedBkashConfig, paymentID: string): Promise<{
    trxID: string | null;
    transactionStatus: string | null;
    amountBdt: string | null;
}>;
export declare function executeCheckoutPayment(cfg: MergedBkashConfig, paymentID: string): Promise<{
    trxID: string | null;
    amountBdt: string | null;
}>;
export declare function bkashAmountMatchesOrderTotal(orderTotalBdt: number, bkashAmountStr: string | null): boolean;
//# sourceMappingURL=bkashService.d.ts.map