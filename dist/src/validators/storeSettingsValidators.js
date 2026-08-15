"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStoreSettingsValidator = void 0;
const express_validator_1 = require("express-validator");
exports.updateStoreSettingsValidator = [
    (0, express_validator_1.body)('siteTitle').optional().isString().isLength({ min: 1, max: 255 }),
    (0, express_validator_1.body)('siteLogo').optional().isString().isLength({ max: 2048 }),
    (0, express_validator_1.body)('emailHeaderLogo').optional().isString().isLength({ max: 2048 }),
    (0, express_validator_1.body)('emailHeaderSlogan').optional().isString().isLength({ max: 255 }),
    (0, express_validator_1.body)('emailHeaderSubtitle').optional().isString().isLength({ max: 255 }),
    (0, express_validator_1.body)('emailFooterSupportEmail').optional().isString().isLength({ max: 255 }),
    (0, express_validator_1.body)('emailFooterSupportNumber').optional().isString().isLength({ max: 100 }),
    (0, express_validator_1.body)('storeName').optional().isString().isLength({ min: 1, max: 255 }),
    (0, express_validator_1.body)('contactEmail').optional().isString().isLength({ max: 255 }),
    (0, express_validator_1.body)('address').optional().isString().isLength({ max: 1000 }),
    (0, express_validator_1.body)('currency').optional().isIn(['BDT', 'USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD']),
    (0, express_validator_1.body)('timezone')
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
    (0, express_validator_1.body)('socialLinks').optional().isArray({ max: 30 }),
    (0, express_validator_1.body)('shippingMethods').optional().isArray({ max: 20 }),
];
//# sourceMappingURL=storeSettingsValidators.js.map