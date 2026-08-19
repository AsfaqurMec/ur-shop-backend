import { query, param, body } from 'express-validator';

const ADMIN_ORDER_STATUSES = ['pending', 'placed', 'delivered', 'complete', 'completed', 'cancelled', 'refunded', 'processing', 'paid', 'unpaid'];

export const recentListValidator = [
  query('limit').optional().isInt({ min: 1, max: 200 }).toInt(),
];

/** Recent orders list: optional offset for pagination. */
export const recentOrdersQueryValidator = [
  query('limit').optional().isInt({ min: 1, max: 200 }).toInt(),
  query('offset').optional().isInt({ min: 0, max: 500_000 }).toInt(),
  query('status').optional({ values: 'falsy' }).isIn(ADMIN_ORDER_STATUSES).withMessage('Invalid order status'),
];

export const updateOrderStatusValidator = [
  param('orderId').isInt({ min: 1 }).withMessage('Valid order id is required').toInt(),
  body('status').isIn(['pending', 'placed', 'delivered', 'complete', 'cancelled', 'refunded', 'processing', 'paid', 'unpaid']).withMessage('Invalid order status'),
];

/** Email logs: pagination + optional template filter (slug-style name). */
export const emailLogsQueryValidator = [
  query('limit').optional().isInt({ min: 1, max: 200 }).toInt(),
  query('offset').optional().isInt({ min: 0, max: 500_000 }).toInt(),
  query('template')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ min: 1, max: 128 })
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Invalid template'),
];

export const topProductsValidator = [
  query('limit').optional().isInt({ min: 1, max: 20 }).toInt(),
];

export const lowStockValidator = [
  query('threshold').optional().isInt({ min: 0 }).toInt(),
];

/** Customers with orders: paginated list. */
export const customersListQueryValidator = [
  query('limit').optional().isInt({ min: 1, max: 200 }).toInt(),
  query('offset').optional().isInt({ min: 0, max: 500_000 }).toInt(),
];

export const customerUserIdParamValidator = [
  param('userId').isInt({ min: 1 }).withMessage('Valid user id is required').toInt(),
];

export const updateCustomerValidator = [
  ...customerUserIdParamValidator,
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Valid email required'),
  body('name').trim().isLength({ max: 255 }).withMessage('Name max 255 characters'),
  body('mobile').optional({ values: 'null' }).trim().isLength({ max: 32 }).withMessage('Mobile max 32 characters'),
  body('address').optional({ values: 'null' }).trim().isLength({ max: 1000 }).withMessage('Address max 1000 characters'),
];

export const deleteOrderValidator = [
  param('id').isInt({ min: 1 }).withMessage('Valid order id is required').toInt(),
];

export const updateOrderPaymentStatusValidator = [
  param('orderId').isInt({ min: 1 }).toInt(),
  body('payment_status').isIn(['paid', 'unpaid']).withMessage('Payment status must be paid or unpaid'),
];
