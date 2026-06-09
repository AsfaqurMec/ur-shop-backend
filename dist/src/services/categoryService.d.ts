import type { CategoryPublic, CategoryNested } from '../types/category';
export declare function create(data: {
    name: string;
    slug?: string;
    description?: string | null;
    parent_id?: number | null;
    sort_order?: number;
}): Promise<CategoryPublic>;
export declare function update(id: number, data: {
    name?: string;
    slug?: string;
    description?: string | null;
    parent_id?: number | null;
    sort_order?: number;
}): Promise<CategoryPublic>;
export declare function remove(id: number): Promise<void>;
export declare function list(nested: boolean): Promise<CategoryPublic[] | CategoryNested[]>;
export declare function listPaginated(page: number, limit: number): Promise<{
    categories: CategoryPublic[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}>;
export declare function getBySlug(slug: string): Promise<CategoryPublic>;
//# sourceMappingURL=categoryService.d.ts.map