export declare function invalidateAdCache(): void;
export declare function create(image_path: string, is_active?: boolean): Promise<{
    id: number;
    image_path: string;
    is_active: boolean;
    created_at: string;
}>;
export declare function update(id: number, data: {
    image_path?: string;
    is_active?: boolean;
}): Promise<{
    id: number;
    image_path: string;
    is_active: boolean;
    created_at: string;
}>;
export declare function remove(id: number): Promise<void>;
export declare function listAdmin(): Promise<{
    id: number;
    image_path: string;
    is_active: boolean;
    created_at: string;
}[]>;
export declare function listPublic(): Promise<{
    id: number;
    image_path: string;
    is_active: boolean;
    created_at: string;
}[]>;
//# sourceMappingURL=adService.d.ts.map