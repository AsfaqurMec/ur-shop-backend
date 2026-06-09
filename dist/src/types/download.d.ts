export interface DownloadTokenRow {
    id: number;
    token: string;
    entitlement_id: number;
    user_id: number;
    expires_at: Date;
    max_uses: number;
    use_count: number;
    created_at: Date;
}
export interface DownloadableItemPublic {
    entitlement_id: number;
    order_item_id: number;
    order_id: number;
    order_number: string;
    product_id: number;
    product_name: string;
    product_file_id: number;
    file_name: string;
    file_size: number | null;
    download_count: number;
    download_limit: number | null;
    expires_at: string | null;
    created_at: string;
}
export interface DownloadTokenPublic {
    token: string;
    expires_at: string;
    url: string;
}
//# sourceMappingURL=download.d.ts.map