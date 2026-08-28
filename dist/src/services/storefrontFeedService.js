"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.invalidateHomeFeedCache = invalidateHomeFeedCache;
exports.getHomeFeed = getHomeFeed;
const productService = __importStar(require("./productService"));
const bannerService = __importStar(require("./bannerService"));
const categoryService = __importStar(require("./categoryService"));
const storeSettingsService = __importStar(require("./storeSettingsService"));
const reviewService = __importStar(require("./reviewService"));
const adService = __importStar(require("./adService"));
let cachedHomeFeed = null;
let feedCacheTimestamp = 0;
const FEED_CACHE_TTL_MS = 30 * 1000; // 30 seconds server memory cache
function invalidateHomeFeedCache() {
    cachedHomeFeed = null;
    feedCacheTimestamp = 0;
}
async function getHomeFeed(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && cachedHomeFeed && feedCacheTimestamp > 0 && now - feedCacheTimestamp < FEED_CACHE_TTL_MS) {
        return cachedHomeFeed;
    }
    const [featuredResult, trendingResult, banners, settings, categoriesRaw, storefrontReviews, ads,] = await Promise.all([
        productService.list({ page: 1, featured: true, limit: 8, is_active: true }).catch(() => ({ products: [] })),
        productService.list({ page: 1, trending: true, limit: 8, is_active: true }).catch(() => ({ products: [] })),
        bannerService.listPublic().catch(() => []),
        storeSettingsService.getPublicStoreSettings().catch(() => null),
        categoryService.list(false).catch(() => []),
        reviewService.listAllPublic({ limit: 12 }).catch(() => ({ reviews: [], total: 0 })),
        adService.listPublic().catch(() => []),
    ]);
    const topCategories = categoriesRaw
        .filter((c) => c.parent_id == null)
        .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
    const categoryProducts = await Promise.all(topCategories.map(async (category) => {
        const result = await productService.list({
            page: 1,
            category_id: category.id,
            limit: 8,
            is_active: true,
        }).catch(() => ({ products: [] }));
        return { category, products: result.products };
    }));
    const feed = {
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
//# sourceMappingURL=storefrontFeedService.js.map