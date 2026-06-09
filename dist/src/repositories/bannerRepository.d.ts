import type { BannerButton, BannerRow } from '../types/banner';
export declare function create(data: {
    background_image: string;
    title: string | null;
    subtitle: string | null;
    buttons: BannerButton[];
    sort_order: number;
    is_active: boolean;
}): Promise<number>;
export declare function update(id: number, data: Partial<{
    background_image: string;
    title: string | null;
    subtitle: string | null;
    buttons: BannerButton[];
    sort_order: number;
    is_active: boolean;
}>): Promise<void>;
export declare function softDelete(id: number): Promise<boolean>;
export declare function findById(id: number): Promise<BannerRow | null>;
export declare function findAll(): Promise<BannerRow[]>;
export declare function findActive(): Promise<BannerRow[]>;
//# sourceMappingURL=bannerRepository.d.ts.map