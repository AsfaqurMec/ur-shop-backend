import { body, param } from 'express-validator';

const CODE_MAX = 64;

export const createCouponValidator = [
  body('code').trim().notEmpty().withMessage('Code is required').isLength({ max: CODE_MAX }).withMessage(`Code max ${CODE_MAX} characters`),
  body('type').isIn(['percentage', 'fixed_amount']).withMessage('type must be percentage or fixed_amount'),
  body('value').isFloat({ min: 0.01 }).withMessage('value must be greater than 0').toFloat(),
  body('min_order_amount').optional().isFloat({ min: 0 }).toFloat(),
  body('max_uses').optional().isInt({ min: 0 }).toInt(),
  body('max_uses_per_user').optional().isInt({ min: 0 }).toInt(),
  body('valid_from').optional().isISO8601().withMessage('valid_from must be ISO 8601 date').toDate(),
  body('valid_until').optional().isISO8601().withMessage('valid_until must be ISO 8601 date').toDate(),
  body('is_active').optional().isBoolean().toBoolean(),
  body('product_ids').optional().isArray().withMessage('product_ids must be an array'),
  body('product_ids.*').optional().isInt({ min: 1 }).toInt(),
  body('category_ids').optional().isArray().withMessage('category_ids must be an array'),
  body('category_ids.*').optional().isInt({ min: 1 }).toInt(),
];

export const updateCouponValidator = [
  param('id').isInt({ min: 1 }).withMessage('Valid coupon id is required').toInt(),
  body('code').optional().trim().notEmpty().withMessage('Code cannot be empty').isLength({ max: CODE_MAX }),
  body('type').optional().isIn(['percentage', 'fixed_amount']),
  body('value').optional().isFloat({ min: 0.01 }).toFloat(),
  body('min_order_amount').optional().isFloat({ min: 0 }).toFloat(),
  body('max_uses').optional().isInt({ min: 0 }).toInt(),
  body('max_uses_per_user').optional().isInt({ min: 0 }).toInt(),
  body('valid_from').optional({ nullable: true }).isISO8601().toDate(),
  body('valid_until').optional({ nullable: true }).isISO8601().toDate(),
  body('is_active').optional().isBoolean().toBoolean(),
  body('product_ids').optional().isArray(),
  body('product_ids.*').optional().isInt({ min: 1 }).toInt(),
  body('category_ids').optional().isArray(),
  body('category_ids.*').optional().isInt({ min: 1 }).toInt(),
];

export const couponIdParamValidator = [
  param('id').isInt({ min: 1 }).withMessage('Valid coupon id is required').toInt(),
];

export const setActiveValidator = [
  param('id').isInt({ min: 1 }).toInt(),
  body('is_active').isBoolean().withMessage('is_active must be true or false').toBoolean(),
];

export const validateCouponValidator = [
  body('code').trim().notEmpty().withMessage('Code is required'),
  body('subtotal').isFloat({ min: 0 }).withMessage('subtotal must be a non-negative number').toFloat(),
  body('items').optional().isArray().withMessage('items must be an array'),
  body('items.*.product_id').optional().isInt({ min: 1 }).toInt(),
  body('items.*.category_id').optional().custom((v) => v === null || v === undefined || (Number.isInteger(Number(v)) && Number(v) >= 1)),
  body('items.*.quantity').optional().isInt({ min: 1 }).toInt(),
  body('items.*.unit_price').optional().isFloat({ min: 0 }).toFloat(),
];
