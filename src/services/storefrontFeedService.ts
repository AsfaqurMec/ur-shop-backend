import * as productService from './productService';
import * as bannerService from './bannerService';
import * as categoryService from './categoryService';
import * as storeSettingsService from './storeSettingsService';
import * as reviewService from './reviewService';
import * as adService from './adService';
import type { ProductPublic } from '../types/product';
import type { CategoryPublic } from '../types/category';
import type { BannerPublic } from '../types/banner';

export interface HomeFeedData {
  featuredProducts: ProductPublic[];
  trendingProducts: ProductPublic[];
  banners: BannerPublic[];
  categories: CategoryPublic[];
  categoryProducts: Array<{ category: CategoryPublic; products: ProductPublic[] }>;
  reviews: any[];
  ads: any[];
  settings: any;
}

let cachedHomeFeed: HomeFeedData | null = null;
let feedCacheTimestamp = 0;
const FEED_CACHE_TTL_MS = 30 * 1000; // 30 seconds server memory cache

export function invalidateHomeFeedCache(): void {
  cachedHomeFeed = null;
  feedCacheTimestamp = 0;
}

export async function getHomeFeed(forceRefresh = false): Promise<HomeFeedData> {
  const now = Date.now();
  if (!forceRefresh && cachedHomeFeed && feedCacheTimestamp > 0 && now - feedCacheTimestamp < FEED_CACHE_TTL_MS) {
    return cachedHomeFeed;
  }

  const [
    featuredResult,
    trendingResult,
    banners,
    settings,
    categoriesRaw,
    storefrontReviews,
    ads,
  ] = await Promise.all([
    productService.list({ page: 1, featured: true, limit: 8, is_active: true }).catch(() => ({ products: [] as ProductPublic[] })),
    productService.list({ page: 1, trending: true, limit: 8, is_active: true }).catch(() => ({ products: [] as ProductPublic[] })),
    bannerService.listPublic().catch(() => [] as BannerPublic[]),
    storeSettingsService.getPublicStoreSettings().catch(() => null),
    categoryService.list(false).catch(() => [] as CategoryPublic[]),
    reviewService.listAllPublic({ limit: 12 }).catch(() => ({ reviews: [], total: 0 })),
    adService.listPublic().catch(() => []),
  ]);

  const topCategories = (categoriesRaw as CategoryPublic[])
    .filter((c) => c.parent_id == null)
    .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));

  const categoryProducts = await Promise.all(
    topCategories.map(async (category) => {
      const result = await productService.list({
        page: 1,
        category_id: category.id,
        limit: 8,
        is_active: true,
      }).catch(() => ({ products: [] as ProductPublic[] }));
      return { category, products: result.products };
    })
  );

  const feed: HomeFeedData = {
    featuredProducts: featuredResult.products,
    trendingProducts: trendingResult.products,
    banners,
    categories: topCategories,
    categoryProducts: categoryProducts.filter((s) => s.products.length > 0),
    reviews: storefrontReviews.reviews,
    ads,
    settings,
  };

  cachedHomeFeed = feed;
  feedCacheTimestamp = now;

  return feed;
}
