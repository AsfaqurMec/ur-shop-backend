import type { PaymentOptionRow } from '../repositories/paymentOptionRepository';
import type { PaymentMethodPublic } from '../types/payment';
/** Merged bKash API config (DB merchant_credentials override env when set). */
export interface MergedBkashConfig {
    baseUrl: string;
    username: string;
    password: string;
    appKey: string;
    appSecret: string;
    agreementId: string;
    callbackBaseUrl: string;
}
/** Merge DB row with env (non-empty DB fields win). */
export declare function mergeBkashCredentials(row: PaymentOptionRow | null): MergedBkashConfig | null;
export declare function isBkashConfigComplete(cfg: MergedBkashConfig | null): boolean;
/** Whether bKash stale-order cleanup should run (enabled merchant option or legacy env). */
export declare function isBkashMerchantCleanupActive(): Promise<boolean>;
/** Public catalog: enabled options only; omits bKash merchant if credentials incomplete. */
export declare function listPublicPaymentMethods(): Promise<PaymentMethodPublic[]>;
export declare function assertCheckoutGatewayAllowed(gatewayKey: string): Promise<PaymentOptionRow>;
export declare function isMfsReferenceRow(row: PaymentOptionRow): boolean;
export declare function isBankProofRow(row: PaymentOptionRow): boolean;
/** Resolve option by gateway for proof / approval logic (includes disabled for old orders — use findByGatewayKey). */
export declare function findOptionForGateway(gatewayKey: string): Promise<PaymentOptionRow | null>;
export declare function isManualVerificationGateway(gatewayKey: string): Promise<boolean>;
export declare function isBankProofGateway(gatewayKey: string): Promise<boolean>;
export declare function isMfsReferenceGateway(gatewayKey: string): Promise<boolean>;
export interface PaymentOptionAdmin extends PaymentMethodPublic {
    payment_option_id: number;
    is_enabled: boolean;
    sort_order: number;
    merchant_credentials_masked?: MerchantCredentialsMasked | null;
}
export interface MerchantCredentialsMasked {
    username: string;
    app_key: string;
    agreement_id: string;
    base_url: string;
    callback_base_url: string;
    password_set: boolean;
    app_secret_set: boolean;
}
export declare function listAllForAdmin(): Promise<PaymentOptionAdmin[]>;
export interface CreatePaymentOptionBody {
    kind: 'manual' | 'merchant';
    gateway_key: string;
    name: string;
    description?: string | null;
    is_enabled?: boolean;
    sort_order?: number;
    manual_flow?: 'mfs_reference' | 'bank_proof' | null;
    bank_details?: Record<string, unknown> | null;
    merchant_credentials?: Record<string, unknown> | null;
    ui_brand?: string | null;
}
export declare function createOption(body: CreatePaymentOptionBody): Promise<PaymentOptionAdmin>;
export declare function updateOption(id: number, patch: {
    name?: string;
    description?: string | null;
    is_enabled?: boolean;
    sort_order?: number;
    manual_flow?: 'mfs_reference' | 'bank_proof' | null;
    bank_details?: Record<string, unknown> | null;
    merchant_credentials?: Record<string, unknown> | null;
    ui_brand?: string | null;
}): Promise<PaymentOptionAdmin>;
export declare function removeOption(id: number): Promise<void>;
//# sourceMappingURL=paymentOptionService.d.ts.map