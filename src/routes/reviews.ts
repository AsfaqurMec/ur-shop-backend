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
  listAllPublicReviewsValidator,
  listAllAdminReviewsValidator,
  setHiddenValidator,
  createAdminReviewValidator,
  updateAdminReviewValidator,
} from '../validators/reviewValidators';
import { uploadReviewImage } from '../middlewares/upload';

const router = Router();

// More specific paths first so /product/... and /admin/... are not matched as :reviewId

// ---- Public: product reviews list ----
router.get(
  '/',
  validate(listAllPublicReviewsValidator),
  asyncHandler(reviewController.listAllPublic)
);

router.get(
  '/product/:productId',
  validate(listReviewsValidator),
  asyncHandler(reviewController.listByProduct)
);

// ---- Customer (authenticated): submit under product ----
router.post(
  '/product/:productId',
  auth,
  (req, res, next) => uploadReviewImage(req, res, (err) => (err ? next(err) : next())),
  validate(submitReviewValidator),
  asyncHandler(reviewController.submitReview)
);

router.post(
  '/admin',
  auth,
  admin,
  (req, res, next) => uploadReviewImage(req, res, (err) => (err ? next(err) : next())),
  validate(createAdminReviewValidator),
  asyncHandler(reviewController.createAdminReview)
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

router.put(
  '/admin/:reviewId',
  auth,
  admin,
  (req, res, next) => uploadReviewImage(req, res, (err) => (err ? next(err) : next())),
  validate(updateAdminReviewValidator),
  asyncHandler(reviewController.updateAdminReview)
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
  (req, res, next) => uploadReviewImage(req, res, (err) => (err ? next(err) : next())),
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
