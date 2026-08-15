import { body } from 'express-validator';

export const updateStoreSettingsValidator = [
  body('siteTitle').optional().isString().isLength({ min: 1, max: 255 }),
  body('siteLogo').optional().isString().isLength({ max: 2048 }),
  body('emailHeaderLogo').optional().isString().isLength({ max: 2048 }),
  body('emailHeaderSlogan').optional().isString().isLength({ max: 255 }),
  body('emailHeaderSubtitle').optional().isString().isLength({ max: 255 }),
  body('emailFooterSupportEmail').optional().isString().isLength({ max: 255 }),
  body('emailFooterSupportNumber').optional().isString().isLength({ max: 100 }),
  body('storeName').optional().isString().isLength({ min: 1, max: 255 }),
  body('contactEmail').optional().isString().isLength({ max: 255 }),
  body('address').optional().isString().isLength({ max: 1000 }),
  body('currency').optional().isIn(['BDT', 'USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD']),
  body('timezone')
    .optional()
    .isIn([
      'UTC',
      'America/New_York',
      'America/Chicago',
      'America/Denver',
      'America/Los_Angeles',
      'Europe/London',
      'Europe/Paris',
      'Asia/Dubai',
      'Asia/Kolkata',
      'Asia/Tokyo',
      'Australia/Sydney',
    ]),
  body('socialLinks').optional().isArray({ max: 30 }),
  body('shippingMethods').optional().isArray({ max: 20 }),
];
