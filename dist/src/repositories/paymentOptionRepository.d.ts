export type PaymentOptionKind = 'manual' | 'merchant';
export type ManualFlow = 'mfs_reference' | 'bank_proof';
export interface PaymentOptionRow {
    id: number;
    kind: PaymentOptionKind;
    gateway_key: string;
    name: string;
    description: string | null;
    is_enabled: number;
    sort_order: number;
    manual_flow: ManualFlow | null;
    bank_details: Record<string, unknown> | null;
    merchant_credentials: Record<string, unknown> | null;
    ui_brand: string | null;
    created_at: Date;
    updated_at: Date;
}
export declare function findAll(): Promise<PaymentOptionRow[]>;
export declare function findEnabledPublic(): Promise<PaymentOptionRow[]>;
export declare function findById(id: number): Promise<PaymentOptionRow | null>;
export declare function findByGatewayKey(gatewayKey: string): Promise<PaymentOptionRow | null>;
export declare function findEnabledByGatewayKey(gatewayKey: string): Promise<PaymentOptionRow | null>;
export interface CreatePaymentOptionInput {
    kind: PaymentOptionKind;
    gateway_key: string;
    name: string;
    description?: string | null;
    is_enabled?: boolean;
    sort_order?: number;
    manual_flow?: ManualFlow | null;
    bank_details?: Record<string, unknown> | null;
    merchant_credentials?: Record<string, unknown> | null;
    ui_brand?: string | null;
}
export declare function createRow(input: CreatePaymentOptionInput): Promise<number>;
export interface UpdatePaymentOptionInput {
    name?: string;
    description?: string | null;
    is_enabled?: boolean;
    sort_order?: number;
    manual_flow?: ManualFlow | null;
    bank_details?: Record<string, unknown> | null;
    merchant_credentials?: Record<string, unknown> | null;
    ui_brand?: string | null;
}
export declare function updateById(id: number, patch: UpdatePaymentOptionInput): Promise<boolean>;
export declare function deleteById(id: number): Promise<boolean>;
export declare function countByGatewayKey(gatewayKey: string, excludeId?: number): Promise<number>;
export declare function countByKind(kind: 'manual' | 'merchant'): Promise<number>;
//# sourceMappingURL=paymentOptionRepository.d.ts.map