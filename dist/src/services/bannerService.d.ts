import type { BannerButton, BannerPublic } from '../types/banner';
export declare function normalizeButtons(input: unknown): BannerButton[];
export declare function invalidateBannerCache(): void;
export declare function create(data: {
    background_image: string;
    title?: string | null;
    subtitle?: string | null;
    buttons?: unknown;
    sort_order?: number;
    is_active?: boolean;
}): Promise<BannerPublic>;
export declare function update(id: number, data: Partial<{
    background_image: string;
    title: string | null;
    subtitle: string | null;
    buttons: unknown;
    sort_order: number;
    is_active: boolean;
}>): Promise<BannerPublic>;
export declare function remove(id: number): Promise<void>;
export declare function listAdmin(): Promise<BannerPublic[]>;
export declare function listPublic(): Promise<BannerPublic[]>;
//# sourceMappingURL=bannerService.d.ts.map