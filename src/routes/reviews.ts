import { Router } from 'express';
import * as reviewController from '../controllers/reviewController';
import { validate } from '../middlewares/validate';
import { auth } from '../middlewares/auth';
import { admin } from '../middlewares/admin';
import { asyncHandler } from '../utils/asyncHandler';
import {
  productIdParamValidator,
  reviewIdParamValidator,
  submitReviewValidator,
  updateReviewValidator,
  listReviewsValidator,
  listAllAdminReviewsValidator,
  setHiddenValidator,
} from '../validators/reviewValidators';

const router = Router();

// More specific paths first so /product/... and /admin/... are not matched as :reviewId

// ---- Public: product reviews list ----
router.get(
  '/product/:productId',
  validate(listReviewsValidator),
  asyncHandler(reviewController.listByProduct)
);

// ---- Customer (authenticated): submit under product ----
router.post(
  '/product/:productId',
  auth,
  validate(submitReviewValidator),
  asyncHandler(reviewController.submitReview)
);

// ---- Admin: global list (before /admin/product and /admin/:reviewId) ----
router.get(
  '/admin',
  auth,
  admin,
  validate(listAllAdminReviewsValidator),
  asyncHandler(reviewController.listAllAdmin)
);

// ---- Admin: list all reviews for a product ----
router.get(
  '/admin/product/:productId',
  auth,
  admin,
  validate(listReviewsValidator),
  asyncHandler(reviewController.listByProductAdmin)
);

// ---- Admin: get any review ----
router.get(
  '/admin/:reviewId',
  auth,
  admin,
  validate(reviewIdParamValidator),
  asyncHandler(reviewController.getReviewDetailAdmin)
);

// ---- Admin: hide/unhide ----
router.patch(
  '/:reviewId/hidden',
  auth,
  admin,
  validate(setHiddenValidator),
  asyncHandler(reviewController.setHidden)
);

// ---- Customer: update own, get own ----
router.put(
  '/:reviewId',
  auth,
  validate(updateReviewValidator),
  asyncHandler(reviewController.updateReview)
);

router.get(
  '/:reviewId',
  auth,
  validate(reviewIdParamValidator),
  asyncHandler(reviewController.getReviewDetail)
);

export default router;
