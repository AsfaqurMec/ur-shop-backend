import { AppError } from '../middlewares/errorHandler';
import * as reviewRepo from '../repositories/reviewRepository';
import * as orderRepo from '../repositories/orderRepository';
import * as productRepo from '../repositories/productRepository';
import type {
  ReviewPublic,
  ReviewDetailPublic,
  ReviewAdminListItem,
  ReviewAdminTableRow,
  ReviewRow,
} from '../types/review';
import type { ReviewListRow } from '../repositories/reviewRepository';

/** Submit review (verified purchasers only; one per user per product). */
export async function submitReview(
  userId: number,
  productId: number,
  data: { rating: number; title?: string | null; body?: string | null }
): Promise<ReviewDetailPublic> {
  const orderId = await orderRepo.findPaidOrderIdContainingProduct(userId, productId);
  if (orderId == null) {
    throw new AppError(403, 'Only verified purchasers can review this product');
  }

  const existing = await reviewRepo.findByUserAndProduct(userId, productId);
  if (existing) {
    throw new AppError(400, 'You have already reviewed this product. Use update to change your review.');
  }

  const product = await productRepo.findProductById(productId);
  if (!product) throw new AppError(404, 'Product not found');

  const id = await reviewRepo.create({
    product_id: productId,
    user_id: userId,
    order_id: orderId,
    rating: data.rating,
    title: data.title ?? null,
    body: data.body ?? null,
  });

  const review = await reviewRepo.findById(id);
  if (!review) throw new AppError(500, 'Failed to load created review');
  return toDetailPublic(review, product.name);
}

/** Update own review (rating and/or comment). */
export async function updateReview(
  userId: number,
  reviewId: number,
  data: { rating?: number; title?: string | null; body?: string | null }
): Promise<ReviewDetailPublic> {
  const review = await reviewRepo.findById(reviewId);
  if (!review) throw new AppError(404, 'Review not found');
  if (review.user_id !== userId) throw new AppError(403, 'Forbidden');

  await reviewRepo.update(reviewId, data);
  const updated = await reviewRepo.findById(reviewId);
  if (!updated) throw new AppError(500, 'Failed to load review');
  const product = await productRepo.findProductById(updated.product_id);
  return toDetailPublic(updated, product?.name ?? '');
}

/** Public list of reviews for a product (not hidden). */
export async function listByProduct(
  productId: number,
  options: { limit?: number; offset?: number } = {}
): Promise<{ reviews: ReviewPublic[]; total: number }> {
  const [reviews, total] = await Promise.all([
    reviewRepo.findByProductIdPublic(productId, options),
    reviewRepo.countByProductIdPublic(productId),
  ]);
  const items: ReviewPublic[] = reviews.map((r) => ({
    id: r.id,
    product_id: r.product_id,
    user_id: r.user_id,
    rating: r.rating,
    title: r.title,
    body: r.body,
    is_verified_purchase: r.order_id != null,
    created_at: r.created_at.toISOString(),
    updated_at: r.updated_at.toISOString(),
  }));
  return { reviews: items, total };
}

/** Admin: all reviews for a product (moderation). */
export async function listByProductAdmin(
  productId: number,
  options: { limit?: number; offset?: number } = {}
): Promise<{ reviews: ReviewAdminListItem[]; total: number }> {
  const [reviews, total] = await Promise.all([
    reviewRepo.findByProductIdAdmin(productId, options),
    reviewRepo.countByProductIdAdmin(productId),
  ]);
  const items: ReviewAdminListItem[] = reviews.map((r) => ({
    id: r.id,
    product_id: r.product_id,
    user_id: r.user_id,
    rating: r.rating,
    title: r.title,
    body: r.body,
    status: r.status as ReviewAdminListItem['status'],
    is_hidden: r.deleted_at != null,
    is_verified_purchase: r.order_id != null,
    created_at: r.created_at.toISOString(),
    updated_at: r.updated_at.toISOString(),
  }));
  return { reviews: items, total };
}

function mapJoinRowToAdminTable(r: reviewRepo.ReviewAdminTableJoinRow): ReviewAdminTableRow {
  return {
    id: r.id,
    product_id: r.product_id,
    user_id: r.user_id,
    rating: r.rating,
    title: r.title,
    body: r.body,
    status: r.status as ReviewAdminTableRow['status'],
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
export async function listAllAdmin(
  categoryId: number | undefined,
  options: { limit?: number; offset?: number } = {}
): Promise<{ reviews: ReviewAdminTableRow[]; total: number }> {
  const [reviews, total] = await Promise.all([
    reviewRepo.findAllAdmin(categoryId, options),
    reviewRepo.countAllAdmin(categoryId),
  ]);
  return { reviews: reviews.map(mapJoinRowToAdminTable), total };
}

/** Admin: hide or unhide a review (soft delete / restore). */
export async function setReviewHidden(reviewId: number, hidden: boolean): Promise<ReviewDetailPublic> {
  const review = await reviewRepo.findById(reviewId);
  if (!review) throw new AppError(404, 'Review not found');
  await reviewRepo.setHidden(reviewId, hidden);
  const updated = await reviewRepo.findById(reviewId);
  if (!updated) throw new AppError(500, 'Failed to load review');
  const product = await productRepo.findProductById(updated.product_id);
  return toDetailPublic(updated, product?.name ?? '');
}

/** Get single review as detail (for owner or admin). */
export async function getReviewDetail(reviewId: number, userId?: number, isAdmin?: boolean): Promise<ReviewDetailPublic> {
  const review = await reviewRepo.findById(reviewId);
  if (!review) throw new AppError(404, 'Review not found');
  if (!isAdmin && userId != null && review.user_id !== userId) {
    throw new AppError(403, 'Forbidden');
  }
  const product = await productRepo.findProductById(review.product_id);
  return toDetailPublic(review, product?.name ?? '');
}

function toDetailPublic(r: ReviewRow | ReviewListRow, productName: string): ReviewDetailPublic {
  return {
    id: r.id,
    product_id: r.product_id,
    product_name: productName,
    user_id: r.user_id,
    order_id: r.order_id,
    rating: r.rating,
    title: r.title,
    body: r.body,
    status: r.status as ReviewDetailPublic['status'],
    is_hidden: r.deleted_at != null,
    is_verified_purchase: r.order_id != null,
    created_at: r.created_at.toISOString(),
    updated_at: r.updated_at.toISOString(),
  };
}
