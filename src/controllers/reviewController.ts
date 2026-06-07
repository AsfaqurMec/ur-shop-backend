import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/apiResponse';
import * as reviewService from '../services/reviewService';

/** Customer: submit review for a purchased product. */
export async function submitReview(req: Request, res: Response): Promise<Response> {
  if (!req.user) return sendError(res, 'Unauthorized', 401);
  const productId = Number(req.params.productId);
  const rating = Number(req.body.rating);
  const title = req.body.title != null ? String(req.body.title).trim() : undefined;
  const body = req.body.body != null ? String(req.body.body).trim() : undefined;
  const review = await reviewService.submitReview(req.user.id, productId, {
    rating,
    title: title ?? null,
    body: body ?? null,
  });
  return sendSuccess(res, review, 201, 'Review submitted');
}

/** Customer: update own review. */
export async function updateReview(req: Request, res: Response): Promise<Response> {
  if (!req.user) return sendError(res, 'Unauthorized', 401);
  const reviewId = Number(req.params.reviewId);
  const rating = req.body.rating != null ? Number(req.body.rating) : undefined;
  const title = req.body.title !== undefined ? (req.body.title === null ? null : String(req.body.title).trim()) : undefined;
  const body = req.body.body !== undefined ? (req.body.body === null ? null : String(req.body.body).trim()) : undefined;
  const review = await reviewService.updateReview(req.user.id, reviewId, {
    rating,
    title,
    body,
  });
  return sendSuccess(res, review, 200, 'Review updated');
}

/** Public: list reviews for a product (not hidden). */
export async function listByProduct(req: Request, res: Response): Promise<Response> {
  const productId = Number(req.params.productId);
  const limit = req.query.limit != null ? Number(req.query.limit) : undefined;
  const offset = req.query.offset != null ? Number(req.query.offset) : undefined;
  const result = await reviewService.listByProduct(productId, { limit, offset });
  return sendSuccess(res, result);
}

/** Admin: list all reviews for a product (pending, approved, hidden). */
export async function listByProductAdmin(req: Request, res: Response): Promise<Response> {
  const productId = Number(req.params.productId);
  const limit = req.query.limit != null ? Number(req.query.limit) : undefined;
  const offset = req.query.offset != null ? Number(req.query.offset) : undefined;
  const result = await reviewService.listByProductAdmin(productId, { limit, offset });
  return sendSuccess(res, result);
}

/** Admin: paginated list of all reviews, optional category filter. */
export async function listAllAdmin(req: Request, res: Response): Promise<Response> {
  const limit = req.query.limit != null ? Number(req.query.limit) : undefined;
  const offset = req.query.offset != null ? Number(req.query.offset) : undefined;
  const categoryId =
    req.query.category_id !== undefined && req.query.category_id !== ''
      ? Number(req.query.category_id)
      : undefined;
  const result = await reviewService.listAllAdmin(categoryId, { limit, offset });
  return sendSuccess(res, result);
}

/** Customer: get own review detail (e.g. to edit). Admin can use admin get. */
export async function getReviewDetail(req: Request, res: Response): Promise<Response> {
  if (!req.user) return sendError(res, 'Unauthorized', 401);
  const reviewId = Number(req.params.reviewId);
  const review = await reviewService.getReviewDetail(reviewId, req.user.id, false);
  return sendSuccess(res, review);
}

/** Admin: hide or unhide a review. */
export async function setHidden(req: Request, res: Response): Promise<Response> {
  const reviewId = Number(req.params.reviewId);
  const hidden = req.body.hidden === true;
  const review = await reviewService.setReviewHidden(reviewId, hidden);
  return sendSuccess(res, review, 200, hidden ? 'Review hidden' : 'Review visible');
}

/** Admin: get any review detail. */
export async function getReviewDetailAdmin(req: Request, res: Response): Promise<Response> {
  const reviewId = Number(req.params.reviewId);
  const review = await reviewService.getReviewDetail(reviewId, undefined, true);
  return sendSuccess(res, review);
}
