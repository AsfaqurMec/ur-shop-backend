"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listCategoriesValidator = exports.getBySlugValidator = exports.deleteCategoryValidator = exports.updateCategoryValidator = exports.createCategoryValidator = void 0;
const express_validator_1 = require("express-validator");
const NAME_MAX = 255;
const SLUG_MAX = 255;
exports.createCategoryValidator = [
    (0, express_validator_1.body)('name').trim().notEmpty().withMessage('Name is required').isLength({ max: NAME_MAX }).withMessage(`Name max ${NAME_MAX} characters`),
    (0, express_validator_1.body)('slug').optional().trim().isLength({ max: SLUG_MAX }).withMessage(`Slug max ${SLUG_MAX} characters`),
    (0, express_validator_1.body)('description').optional().trim(),
    (0, express_validator_1.body)('parent_id').optional().isInt({ min: 1 }).withMessage('parent_id must be a positive integer').toInt(),
    (0, express_validator_1.body)('sort_order').optional().isInt({ min: 0 }).withMessage('sort_order must be a non-negative integer').toInt(),
];
exports.updateCategoryValidator = [
    (0, express_validator_1.param)('id').isInt({ min: 1 }).withMessage('Valid category id is required').toInt(),
    (0, express_validator_1.body)('name').optional().trim().notEmpty().withMessage('Name cannot be empty').isLength({ max: NAME_MAX }).withMessage(`Name max ${NAME_MAX} characters`),
    (0, express_validator_1.body)('slug').optional().trim().isLength({ max: SLUG_MAX }).withMessage(`Slug max ${SLUG_MAX} characters`),
    (0, express_validator_1.body)('description').optional().trim(),
    (0, express_validator_1.body)('parent_id')
        .optional()
        .custom((val) => val === null || val === undefined || (Number.isInteger(Number(val)) && Number(val) >= 1))
        .withMessage('parent_id must be null or a positive integer'),
    (0, express_validator_1.body)('sort_order').optional().isInt({ min: 0 }).withMessage('sort_order must be a non-negative integer').toInt(),
];
exports.deleteCategoryValidator = [
    (0, express_validator_1.param)('id').isInt({ min: 1 }).withMessage('Valid category id is required').toInt(),
];
exports.getBySlugValidator = [
    (0, express_validator_1.param)('slug').trim().notEmpty().withMessage('Slug is required'),
];
exports.listCategoriesValidator = [
    (0, express_validator_1.query)('nested').optional().isIn(['0', '1', 'true', 'false']).withMessage('nested must be 0, 1, true, or false'),
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).toInt(),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 200 }).toInt(),
];
//# sourceMappingURL=categoryValidators.js.map