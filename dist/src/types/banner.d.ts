export interface BannerButton {
    title: string;
    route: string;
}
export interface BannerRow {
    id: number;
    background_image: string;
    title: string | null;
    subtitle: string | null;
    buttons: BannerButton[];
    sort_order: number;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;
}
export interface BannerPublic {
    id: number;
    background_image: string;
    title: string | null;
    subtitle: string | null;
    buttons: BannerButton[];
    sort_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}
//# sourceMappingURL=banner.d.ts.map