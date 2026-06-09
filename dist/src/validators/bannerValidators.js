"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBannerValidator = exports.updateBannerValidator = exports.createBannerValidator = void 0;
const express_validator_1 = require("express-validator");
exports.createBannerValidator = [
    (0, express_validator_1.body)('title').optional().trim().isLength({ max: 255 }).withMessage('Title max 255 characters'),
    (0, express_validator_1.body)('subtitle').optional().trim().isLength({ max: 1000 }).withMessage('Subtitle max 1000 characters'),
    (0, express_validator_1.body)('buttons').optional(),
    (0, express_validator_1.body)('sort_order').optional().isInt({ min: 0 }).withMessage('sort_order must be a non-negative integer').toInt(),
    (0, express_validator_1.body)('is_active').optional().isBoolean().withMessage('is_active must be a boolean').toBoolean(),
];
exports.updateBannerValidator = [
    (0, express_validator_1.param)('id').isInt({ min: 1 }).withMessage('Valid banner id is required').toInt(),
    ...exports.createBannerValidator,
];
exports.deleteBannerValidator = [
    (0, express_validator_1.param)('id').isInt({ min: 1 }).withMessage('Valid banner id is required').toInt(),
];
//# sourceMappingURL=bannerValidators.js.map