import { body, param } from 'express-validator';

export const createBannerValidator = [
  body('title').optional().trim().isLength({ max: 255 }).withMessage('Title max 255 characters'),
  body('subtitle').optional().trim().isLength({ max: 1000 }).withMessage('Subtitle max 1000 characters'),
  body('buttons').optional(),
  body('sort_order').optional().isInt({ min: 0 }).withMessage('sort_order must be a non-negative integer').toInt(),
  body('is_active').optional().isBoolean().withMessage('is_active must be a boolean').toBoolean(),
];

export const updateBannerValidator = [
  param('id').isInt({ min: 1 }).withMessage('Valid banner id is required').toInt(),
  ...createBannerValidator,
];

export const deleteBannerValidator = [
  param('id').isInt({ min: 1 }).withMessage('Valid banner id is required').toInt(),
];
