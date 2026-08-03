"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listAllAdminReviewsValidator = exports.setHiddenValidator = exports.listAllPublicReviewsValidator = exports.listReviewsValidator = exports.createAdminReviewValidator = exports.updateReviewValidator = exports.submitReviewValidator = exports.reviewIdParamValidator = exports.productIdParamValidator = void 0;
const express_validator_1 = require("express-validator");
exports.productIdParamValidator = [
    (0, express_validator_1.param)('productId').isInt({ min: 1 }).withMessage('Valid product id is required').toInt(),
];
exports.reviewIdParamValidator = [
    (0, express_validator_1.param)('reviewId').isInt({ min: 1 }).withMessage('Valid review id is required').toInt(),
];
exports.submitReviewValidator = [
    (0, express_validator_1.param)('productId').isInt({ min: 1 }).toInt(),
    (0, express_validator_1.body)('rating')
        .isInt({ min: 1, max: 5 })
        .withMessage('Rating must be between 1 and 5')
        .toInt(),
    (0, express_validator_1.body)('title').optional().trim().isLength({ max: 255 }),
    (0, express_validator_1.body)('body').optional().trim(),
];
exports.updateReviewValidator = [
    (0, express_validator_1.param)('reviewId').isInt({ min: 1 }).toInt(),
    (0, express_validator_1.body)('rating').optional().isInt({ min: 1, max: 5 }).toInt(),
    (0, express_validator_1.body)('title').optional().trim().isLength({ max: 255 }),
    (0, express_validator_1.body)('body').optional().trim(),
];
exports.createAdminReviewValidator = [
    (0, express_validator_1.body)('product_id').isInt({ min: 1 }).withMessage('A product is required').toInt(),
    (0, express_validator_1.body)('reviewer_name').trim().isLength({ min: 1, max: 120 }).withMessage('Reviewer name is required'),
    (0, express_validator_1.body)('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5').toInt(),
    (0, express_validator_1.body)('title').optional().trim().isLength({ max: 255 }),
    (0, express_validator_1.body)('body').optional().trim(),
];
exports.listReviewsValidator = [
    (0, express_validator_1.param)('productId').isInt({ min: 1 }).toInt(),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    (0, express_validator_1.query)('offset').optional().isInt({ min: 0 }).toInt(),
];
exports.listAllPublicReviewsValidator = [
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    (0, express_validator_1.query)('offset').optional().isInt({ min: 0 }).toInt(),
];
exports.setHiddenValidator = [
    (0, express_validator_1.param)('reviewId').isInt({ min: 1 }).toInt(),
    (0, express_validator_1.body)('hidden').isBoolean().withMessage('hidden must be true or false'),
];
/** Admin global list: optional category_id (omit = all, 0 = uncategorized). */
exports.listAllAdminReviewsValidator = [
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    (0, express_validator_1.query)('offset').optional().isInt({ min: 0 }).toInt(),
    (0, express_validator_1.query)('category_id').optional().isInt({ min: 0 }).toInt(),
];
//# sourceMappingURL=reviewValidators.js.map