export declare function create(data: {
    image_path: string;
    is_active: boolean;
}): Promise<number>;
export declare function findById(id: number): Promise<any>;
export declare function findAll(activeOnly?: boolean): Promise<any[]>;
export declare function update(id: number, data: Record<string, unknown>): Promise<void>;
export declare function remove(id: number): Promise<boolean>;
//# sourceMappingURL=adRepository.d.ts.map