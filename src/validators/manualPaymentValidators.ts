import { body, param } from 'express-validator';

export const submitProofValidator = [
  param('orderId').isInt({ min: 1 }).withMessage('Valid order id is required').toInt(),
  body('sender_number').optional().trim().isLength({ max: 64 }),
  body('transaction_id').optional().trim().isLength({ max: 128 }),
  body('paid_amount').optional().isFloat({ min: 0 }).withMessage('paid_amount must be a non-negative number').toFloat(),
];

export const proofIdParamValidator = [
  param('id').isInt({ min: 1 }).withMessage('Valid proof id is required').toInt(),
];

export const orderIdParamValidator = [
  param('orderId').isInt({ min: 1 }).withMessage('Valid order id is required').toInt(),
];

export const bkashExecuteValidator = [
  body('payment_id').optional().trim().isLength({ min: 1, max: 80 }),
  body('paymentID').optional().trim().isLength({ min: 1, max: 80 }),
  body().custom((_, { req }) => {
    const a = String(req.body?.payment_id ?? '').trim();
    const b = String(req.body?.paymentID ?? '').trim();
    if (!a && !b) throw new Error('payment_id or paymentID is required');
    return true;
  }),
];
