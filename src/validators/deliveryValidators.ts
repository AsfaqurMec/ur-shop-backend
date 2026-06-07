import { body, param } from 'express-validator';

export const orderIdParamValidator = [
  param('orderId').isInt({ min: 1 }).withMessage('Valid order id is required').toInt(),
];

export const fulfillmentIdParamValidator = [
  param('id').isInt({ min: 1 }).withMessage('Valid fulfillment id is required').toInt(),
];

export const markFulfillmentValidator = [
  param('id').isInt({ min: 1 }).toInt(),
  body('notes').optional().trim(),
];
