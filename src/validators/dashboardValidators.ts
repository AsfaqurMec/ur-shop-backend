import { param, query } from 'express-validator';

export const orderIdParamValidator = [
  param('orderId').isInt({ min: 1 }).withMessage('Valid order id is required').toInt(),
];

export const ordersListValidator = [
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
];
