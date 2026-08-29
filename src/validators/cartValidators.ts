import { body, param } from 'express-validator';

export const addItemValidator = [
  body('product_id').isInt({ min: 1 }).withMessage('product_id must be a positive integer').toInt(),
  body('quantity').isInt({ min: 1 }).withMessage('quantity must be at least 1').toInt(),
  body('variation_id')
    .optional({ values: 'null' })
    .custom((value) => {
      if (value === undefined || value === null || value === '') return true;
      const n = Number(value);
      return Number.isFinite(n) && n >= 1 && Math.floor(n) === n;
    })
    .withMessage('variation_id must be a positive integer')
    .customSanitizer((value) => {
      if (value === undefined || value === null || value === '') return undefined;
      return Math.trunc(Number(value));
    }),
  body('selections')
    .optional({ values: 'null' })
    .custom((value) => value == null || (typeof value === 'object' && !Array.isArray(value)))
    .withMessage('selections must be an object'),
];

export const updateItemValidator = [
  param('itemId').isInt({ min: 1 }).withMessage('Valid item id is required').toInt(),
  body('quantity')
    .optional({ values: 'null' })
    .isInt({ min: 1 })
    .withMessage('quantity must be at least 1')
    .toInt(),
  body('variation_id')
    .optional({ values: 'null' })
    .custom((value) => {
      if (value === undefined || value === null || value === '') return true;
      const n = Number(value);
      return Number.isFinite(n) && n >= 1 && Math.floor(n) === n;
    })
    .withMessage('variation_id must be a positive integer')
    .customSanitizer((value) => {
      if (value === undefined || value === null || value === '') return undefined;
      return Math.trunc(Number(value));
    }),
  body('selections')
    .optional({ values: 'null' })
    .custom((value) => value == null || (typeof value === 'object' && !Array.isArray(value)))
    .withMessage('selections must be an object'),
];

export const removeItemValidator = [
  param('itemId').isInt({ min: 1 }).withMessage('Valid item id is required').toInt(),
];
