import { body, param } from 'express-validator';

const gatewayKey = body('gateway_key')
  .trim()
  .isLength({ min: 2, max: 64 })
  .matches(/^[a-z][a-z0-9_]+$/)
  .withMessage('gateway_key: lowercase letter start, alphanumeric and underscores only');

export const createPaymentOptionValidator = [
  body('kind').isIn(['manual', 'merchant']).withMessage('kind must be manual or merchant'),
  gatewayKey,
  body('name').trim().isLength({ min: 1, max: 255 }).withMessage('name is required'),
  body('description').optional({ nullable: true }).isString(),
  body('is_enabled').optional().isBoolean(),
  body('sort_order').optional().isInt({ min: 0, max: 99999 }),
  body('manual_flow')
    .optional({ nullable: true })
    .isIn(['mfs_reference', 'bank_proof'])
    .withMessage('manual_flow must be mfs_reference or bank_proof'),
  body('bank_details').optional({ nullable: true }).isObject(),
  body('merchant_credentials').optional({ nullable: true }).isObject(),
  body('ui_brand')
    .optional({ nullable: true })
    .isIn(['generic', 'bkash', 'nagad', 'rocket'])
    .withMessage('ui_brand'),
];

export const updatePaymentOptionValidator = [
  body('name').optional().trim().isLength({ min: 1, max: 255 }),
  body('description').optional({ nullable: true }).isString(),
  body('is_enabled').optional().isBoolean(),
  body('sort_order').optional().isInt({ min: 0, max: 99999 }),
  body('manual_flow')
    .optional({ nullable: true })
    .isIn(['mfs_reference', 'bank_proof'])
    .withMessage('manual_flow'),
  body('bank_details').optional({ nullable: true }).isObject(),
  body('merchant_credentials').optional({ nullable: true }).isObject(),
  body('ui_brand')
    .optional({ nullable: true })
    .isIn(['generic', 'bkash', 'nagad', 'rocket'])
    .withMessage('ui_brand'),
];

export const paymentOptionIdParamValidator = [
  param('id').isInt({ min: 1 }).withMessage('Invalid id'),
];
