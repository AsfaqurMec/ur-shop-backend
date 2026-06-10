import { body } from 'express-validator';

export const createOrderValidator = [
  body('coupon_code').optional().trim().isLength({ max: 64 }).withMessage('coupon_code max 64 characters'),
  body('payment_method').optional().trim().isLength({ min: 1, max: 64 }).withMessage('Invalid payment_method'),
  body('transaction_id').optional().trim().isLength({ max: 128 }),
  body('bkash_transaction_id').optional().trim().isLength({ max: 128 }),
  body('sender_number').optional().trim().isLength({ max: 64 }),
  body('payment_type').optional().trim().isLength({ max: 32 }),
  body('mobile').trim().notEmpty().withMessage('Mobile number is required').isLength({ max: 32 }),
  body('address').trim().notEmpty().withMessage('Address is required').isLength({ max: 1000 }),
];
