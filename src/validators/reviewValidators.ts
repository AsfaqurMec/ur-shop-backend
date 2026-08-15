import { body, param, query } from 'express-validator';

export const productIdParamValidator = [
  param('productId').isInt({ min: 1 }).withMessage('Valid product id is required').toInt(),
];

export const reviewIdParamValidator = [
  param('reviewId').isInt({ min: 1 }).withMessage('Valid review id is required').toInt(),
];

export const submitReviewValidator = [
  param('productId').isInt({ min: 1 }).toInt(),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5')
    .toInt(),
  body('title').optional().trim().isLength({ max: 255 }),
  body('body').optional().trim(),
];

export const updateReviewValidator = [
  param('reviewId').isInt({ min: 1 }).toInt(),
  body('rating').optional().isInt({ min: 1, max: 5 }).toInt(),
  body('title').optional().trim().isLength({ max: 255 }),
  body('body').optional().trim(),
];

export const createAdminReviewValidator = [
  body('product_id').isInt({ min: 1 }).withMessage('A product is required').toInt(),
  body('reviewer_name').trim().isLength({ min: 1, max: 120 }).withMessage('Reviewer name is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5').toInt(),
  body('title').optional().trim().isLength({ max: 255 }),
  body('body').optional().trim(),
];

export const updateAdminReviewValidator = [
  param('reviewId').isInt({ min: 1 }).toInt(),
  body('reviewer_name').optional().trim().isLength({ min: 1, max: 120 }).withMessage('Reviewer name is required'),
  body('rating').optional().isInt({ min: 1, max: 5 }).toInt(),
  body('title').optional().trim().isLength({ max: 255 }),
  body('body').optional().trim(),
];

export const listReviewsValidator = [
  param('productId').isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
];

export const listAllPublicReviewsValidator = [
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
];

export const setHiddenValidator = [
  param('reviewId').isInt({ min: 1 }).toInt(),
  body('hidden').isBoolean().withMessage('hidden must be true or false'),
];

/** Admin global list: optional category_id (omit = all, 0 = uncategorized). */
export const listAllAdminReviewsValidator = [
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
  query('category_id').optional().isInt({ min: 0 }).toInt(),
];
