export declare function replaceCatalogAttributes(productId: number, body: {
    attributes?: unknown;
}): Promise<void>;
export declare function replaceCatalogVariations(productId: number, body: {
    variations?: unknown;
}): Promise<void>;
export declare function generateCatalogVariations(productId: number): Promise<{
    added: number;
}>;
//# sourceMappingURL=productCatalogService.d.ts.map