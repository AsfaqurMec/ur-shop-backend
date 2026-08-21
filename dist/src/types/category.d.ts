export interface CategoryRow {
    id: number;
    parent_id: number | null;
    name: string;
    slug: string;
    description: string | null;
    image: string | null;
    banner_image: string | null;
    sort_order: number;
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;
}
export interface CategoryPublic {
    id: number;
    parent_id: number | null;
    name: string;
    slug: string;
    description: string | null;
    image: string | null;
    banner_image: string | null;
    sort_order: number;
    product_count?: number;
    created_at: string;
    updated_at: string;
}
export interface CategoryNested extends CategoryPublic {
    children: CategoryNested[];
}
//# sourceMappingURL=category.d.ts.map