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
exports.submitReview = submitReview;
exports.updateReview = updateReview;
exports.listByProduct = listByProduct;
exports.listByProductAdmin = listByProductAdmin;
exports.listAllAdmin = listAllAdmin;
exports.setReviewHidden = setReviewHidden;
exports.updateAdminReview = updateAdminReview;
exports.listAllPublic = listAllPublic;
exports.createAdminReview = createAdminReview;
exports.getReviewDetail = getReviewDetail;
const errorHandler_1 = require("../middlewares/errorHandler");
const reviewRepo = __importStar(require("../repositories/reviewRepository"));
const orderRepo = __importStar(require("../repositories/orderRepository"));
const productRepo = __importStar(require("../repositories/productRepository"));
const authRepo = __importStar(require("../repositories/authRepository"));
/** Submit review (verified purchasers only; one per user per product). */
async function submitReview(userId, productId, data) {
    const orderId = await orderRepo.findPaidOrderIdContainingProduct(userId, productId);
    if (orderId == null) {
        throw new errorHandler_1.AppError(403, 'Only verified purchasers can review this product');
    }
    const existing = await reviewRepo.findByUserAndProduct(userId, productId);
    if (existing) {
        throw new errorHandler_1.AppError(400, 'You have already reviewed this product. Use update to change your review.');
    }
    const product = await productRepo.findProductById(productId);
    if (!product)
        throw new errorHandler_1.AppError(404, 'Product not found');
    const user = await authRepo.findUserById(userId);
    const id = await reviewRepo.create({
        product_id: productId,
        user_id: userId,
        order_id: orderId,
        rating: data.rating,
        title: data.title ?? null,
        body: data.body ?? null,
        image_path: data.image_path ?? null,
        reviewer_name: user?.name ?? null,
    });
    const review = await reviewRepo.findById(id);
    if (!review)
        throw new errorHandler_1.AppError(500, 'Failed to load created review');
    return toDetailPublic(review, product.name);
}
/** Update own review (rating and/or comment). */
async function updateReview(userId, reviewId, data) {
    const review = await reviewRepo.findById(reviewId);
    if (!review)
        throw new errorHandler_1.AppError(404, 'Review not found');
    if (review.user_id !== userId)
        throw new errorHandler_1.AppError(403, 'Forbidden');
    await reviewRepo.update(reviewId, data);
    const updated = await reviewRepo.findById(reviewId);
    if (!updated)
        throw new errorHandler_1.AppError(500, 'Failed to load review');
    const product = await productRepo.findProductById(updated.product_id);
    return toDetailPublic(updated, product?.name ?? '');
}
/** Public list of reviews for a product (not hidden). */
async function listByProduct(productId, options = {}) {
    const [reviews, total] = await Promise.all([
        reviewRepo.findByProductIdPublic(productId, options),
        reviewRepo.countByProductIdPublic(productId),
    ]);
    const items = reviews.map((r) => ({
        id: r.id,
        product_id: r.product_id,
        user_id: r.user_id,
        rating: r.rating,
        title: r.title,
        body: r.body,
        image_path: r.image_path,
        reviewer_name: r.reviewer_name,
        is_verified_purchase: r.order_id != null,
        created_at: r.created_at.toISOString(),
        updated_at: r.updated_at.toISOString(),
    }));
    return { reviews: items, total };
}
/** Admin: all reviews for a product (moderation). */
async function listByProductAdmin(productId, options = {}) {
    const [reviews, total] = await Promise.all([
        reviewRepo.findByProductIdAdmin(productId, options),
        reviewRepo.countByProductIdAdmin(productId),
    ]);
    const items = reviews.map((r) => ({
        id: r.id,
        product_id: r.product_id,
        user_id: r.user_id,
        rating: r.rating,
        title: r.title,
        body: r.body,
        image_path: r.image_path,
        reviewer_name: r.reviewer_name,
        status: r.status,
        is_hidden: r.deleted_at != null,
        is_verified_purchase: r.order_id != null,
        created_at: r.created_at.toISOString(),
        updated_at: r.updated_at.toISOString(),
    }));
    return { reviews: items, total };
}
function mapJoinRowToAdminTable(r) {
    return {
        id: r.id,
        product_id: r.product_id,
        user_id: r.user_id,
        rating: r.rating,
        title: r.title,
        body: r.body,
        image_path: r.image_path,
        reviewer_name: r.reviewer_name,
        status: r.status,
        is_hidden: r.deleted_at != null,
        is_verified_purchase: r.order_id != null,
        created_at: r.created_at.toISOString(),
        updated_at: r.updated_at.toISOString(),
        product_name: r.product_name,
        product_slug: r.product_slug,
        category_id: r.category_id,
        category_name: r.category_name,
    };
}
/** Admin: all reviews with optional category filter (omit = all; 0 = uncategorized). */
async function listAllAdmin(categoryId, options = {}) {
    const [reviews, total] = await Promise.all([
        reviewRepo.findAllAdmin(categoryId, options),
        reviewRepo.countAllAdmin(categoryId),
    ]);
    return { reviews: reviews.map(mapJoinRowToAdminTable), total };
}
/** Admin: hide or unhide a review (soft delete / restore). */
async function setReviewHidden(reviewId, hidden) {
    const review = await reviewRepo.findById(reviewId);
    if (!review)
        throw new errorHandler_1.AppError(404, 'Review not found');
    await reviewRepo.setHidden(reviewId, hidden);
    const updated = await reviewRepo.findById(reviewId);
    if (!updated)
        throw new errorHandler_1.AppError(500, 'Failed to load review');
    const product = await productRepo.findProductById(updated.product_id);
    return toDetailPublic(updated, product?.name ?? '');
}
/** Admin: correct the displayed content of any review without changing its purchase record. */
async function updateAdminReview(reviewId, data) {
    const review = await reviewRepo.findById(reviewId);
    if (!review)
        throw new errorHandler_1.AppError(404, 'Review not found');
    await reviewRepo.update(reviewId, data);
    const updated = await reviewRepo.findById(reviewId);
    if (!updated)
        throw new errorHandler_1.AppError(500, 'Failed to load review');
    const product = await productRepo.findProductById(updated.product_id);
    return toDetailPublic(updated, product?.name ?? '');
}
/** Public: newest published reviews across the catalogue, including product links. */
async function listAllPublic(options = {}) {
    const [reviews, total] = await Promise.all([
        reviewRepo.findAllPublic(options),
        reviewRepo.countAllPublic(),
    ]);
    return {
        reviews: reviews.map((r) => ({
            id: r.id,
            product_id: r.product_id,
            user_id: r.user_id,
            rating: r.rating,
            title: r.title,
            body: r.body,
            image_path: r.image_path,
            reviewer_name: r.reviewer_name,
            is_verified_purchase: r.order_id != null,
            created_at: r.created_at.toISOString(),
            updated_at: r.updated_at.toISOString(),
            product_name: r.product_name,
            product_slug: r.product_slug,
        })),
        total,
    };
}
/** Admin: create a published testimonial without requiring a customer account or order. */
async function createAdminReview(data) {
    const product = await productRepo.findProductById(data.product_id);
    if (!product)
        throw new errorHandler_1.AppError(404, 'Product not found');
    const id = await reviewRepo.create({
        product_id: data.product_id,
        // `0` deliberately identifies an admin-imported testimonial; it is never a customer user id.
        user_id: 0,
        order_id: null,
        rating: data.rating,
        title: data.title ?? null,
        body: data.body ?? null,
        image_path: data.image_path ?? null,
        reviewer_name: data.reviewer_name,
    });
    const review = await reviewRepo.findById(id);
    if (!review)
        throw new errorHandler_1.AppError(500, 'Failed to load created review');
    return toDetailPublic(review, product.name);
}
/** Get single review as detail (for owner or admin). */
async function getReviewDetail(reviewId, userId, isAdmin) {
    const review = await reviewRepo.findById(reviewId);
    if (!review)
        throw new errorHandler_1.AppError(404, 'Review not found');
    if (!isAdmin && userId != null && review.user_id !== userId) {
        throw new errorHandler_1.AppError(403, 'Forbidden');
    }
    const product = await productRepo.findProductById(review.product_id);
    return toDetailPublic(review, product?.name ?? '');
}
function toDetailPublic(r, productName) {
    return {
        id: r.id,
        product_id: r.product_id,
        product_name: productName,
        user_id: r.user_id,
        order_id: r.order_id,
        rating: r.rating,
        title: r.title,
        body: r.body,
        image_path: r.image_path,
        reviewer_name: r.reviewer_name,
        status: r.status,
        is_hidden: r.deleted_at != null,
        is_verified_purchase: r.order_id != null,
        created_at: r.created_at.toISOString(),
        updated_at: r.updated_at.toISOString(),
    };
}
//# sourceMappingURL=reviewService.js.map