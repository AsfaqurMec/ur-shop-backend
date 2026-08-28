import type { ProductPublic } from '../types/product';
import type { CategoryPublic } from '../types/category';
import type { BannerPublic } from '../types/banner';
export interface HomeFeedData {
    featuredProducts: ProductPublic[];
    trendingProducts: ProductPublic[];
    banners: BannerPublic[];
    categories: CategoryPublic[];
    categoryProducts: Array<{
        category: CategoryPublic;
        products: ProductPublic[];
    }>;
    reviews: any[];
    ads: any[];
    settings: any;
}
export declare function invalidateHomeFeedCache(): void;
export declare function getHomeFeed(forceRefresh?: boolean): Promise<HomeFeedData>;
//# sourceMappingURL=storefrontFeedService.d.ts.map