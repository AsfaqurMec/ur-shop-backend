import { body, query } from 'express-validator';

export const createTokenValidator = [
  body('entitlement_id')
    .isInt({ min: 1 })
    .withMessage('Valid entitlement_id is required')
    .toInt(),
];

export const downloadFileValidator = [
  query('token')
    .trim()
    .notEmpty()
    .withMessage('Download token is required')
    .isLength({ min: 32, max: 64 })
    .withMessage('Invalid token format'),
];
