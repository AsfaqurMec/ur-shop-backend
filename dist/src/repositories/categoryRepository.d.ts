import type { CategoryRow } from '../types/category';
export declare function create(data: {
    parent_id: number | null;
    name: string;
    slug: string;
    description: string | null;
    sort_order: number;
}): Promise<number>;
export declare function update(id: number, data: {
    parent_id?: number | null;
    name?: string;
    slug?: string;
    description?: string | null;
    sort_order?: number;
}): Promise<void>;
export declare function softDelete(id: number): Promise<boolean>;
export declare function slugExists(slug: string, excludeId?: number): Promise<boolean>;
export declare function findById(id: number): Promise<CategoryRow | null>;
export declare function findBySlug(slug: string): Promise<CategoryRow | null>;
export declare function findAll(): Promise<CategoryRow[]>;
export declare function countActive(): Promise<number>;
export declare function findPage(limit: number, offset: number): Promise<CategoryRow[]>;
//# sourceMappingURL=categoryRepository.d.ts.map