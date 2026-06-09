export declare function create(_conn: unknown, data: {
    order_item_id: number;
    user_id: number;
    product_file_id: number;
    ip?: string | null;
    user_agent?: string | null;
}): Promise<number>;
export declare function countByOrderItemAndFile(orderItemId: number, productFileId: number): Promise<number>;
//# sourceMappingURL=downloadRepository.d.ts.map