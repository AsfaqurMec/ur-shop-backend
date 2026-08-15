"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCatalogVariationsValidator = exports.replaceCatalogVariationsValidator = exports.replaceCatalogAttributesValidator = exports.replacePurchaseVariablesValidator = exports.updateLicenseKeyValidator = exports.licenseKeyIdParamValidator = exports.listLicenseKeysValidator = exports.addLicensesValidator = exports.fileIdParamValidator = exports.addFileBodyValidator = exports.imageIdParamValidator = exports.addImageValidator = exports.listProductsValidator = exports.productSlugParamValidator = exports.productIdParamValidator = exports.updateProductValidator = exports.createProductValidator = void 0;
const express_validator_1 = require("express-validator");
const product_1 = require("../types/product");
const NAME_MAX = 255;
const SLUG_MAX = 255;
exports.createProductValidator = [
    (0, express_validator_1.body)('name').trim().notEmpty().withMessage('Name is required').isLength({ max: NAME_MAX }).withMessage(`Name max ${NAME_MAX} characters`),
    (0, express_validator_1.body)('slug').optional().trim().isLength({ max: SLUG_MAX }).withMessage(`Slug max ${SLUG_MAX} characters`),
    (0, express_validator_1.body)('description').optional().trim(),
    (0, express_validator_1.body)('full_description').optional({ nullable: true }).isString().trim(),
    (0, express_validator_1.body)('size_chart_image').optional({ nullable: true }).isString().trim(),
    (0, express_validator_1.body)('features').optional({ nullable: true }).isArray().withMessage('features must be an array'),
    (0, express_validator_1.body)('features.*').optional().isString().trim(),
    (0, express_validator_1.body)('category_id')
        .optional()
        .custom((val) => val === null || val === undefined || (Number.isInteger(Number(val)) && Number(val) >= 1))
        .withMessage('category_id must be null or a positive integer'),
    (0, express_validator_1.body)('product_type').notEmpty().withMessage('product_type is required').isIn(product_1.PRODUCT_TYPES).withMessage(`product_type must be one of: ${product_1.PRODUCT_TYPES.join(', ')}`),
    (0, express_validator_1.body)('manual_fulfillment_required').optional().isBoolean().toBoolean(),
    (0, express_validator_1.body)('price').isFloat({ min: 0 }).withMessage('price must be a non-negative number').toFloat(),
    (0, express_validator_1.body)('compare_at_price').optional().isFloat({ min: 0 }).toFloat(),
    (0, express_validator_1.body)('is_active').optional().isBoolean().toBoolean(),
    (0, express_validator_1.body)('is_featured').optional().isBoolean().toBoolean(),
];
exports.updateProductValidator = [
    (0, express_validator_1.param)('id').isInt({ min: 1 }).withMessage('Valid product id is required').toInt(),
    (0, express_validator_1.body)('name').optional().trim().notEmpty().withMessage('Name cannot be empty').isLength({ max: NAME_MAX }).withMessage(`Name max ${NAME_MAX} characters`),
    (0, express_validator_1.body)('slug').optional().trim().isLength({ max: SLUG_MAX }).withMessage(`Slug max ${SLUG_MAX} characters`),
    (0, express_validator_1.body)('description').optional().trim(),
    (0, express_validator_1.body)('full_description').optional({ nullable: true }).isString().trim(),
    (0, express_validator_1.body)('size_chart_image').optional({ nullable: true }).isString().trim(),
    (0, express_validator_1.body)('features').optional({ nullable: true }).isArray().withMessage('features must be an array'),
    (0, express_validator_1.body)('features.*').optional().isString().trim(),
    (0, express_validator_1.body)('category_id').optional().custom((val) => val === null || (Number.isInteger(Number(val)) && Number(val) >= 1)),
    (0, express_validator_1.body)('product_type').optional().isIn(product_1.PRODUCT_TYPES).withMessage(`product_type must be one of: ${product_1.PRODUCT_TYPES.join(', ')}`),
    (0, express_validator_1.body)('manual_fulfillment_required').optional().isBoolean().toBoolean(),
    (0, express_validator_1.body)('price').optional().isFloat({ min: 0 }).toFloat(),
    (0, express_validator_1.body)('compare_at_price').optional().isFloat({ min: 0 }).toFloat(),
    (0, express_validator_1.body)('sku').optional({ values: 'null' }).isString().trim().isLength({ max: 128 }),
    (0, express_validator_1.body)('quantity').optional({ values: 'null' }).isInt({ min: 0 }).toInt(),
    (0, express_validator_1.body)('default_variation_id')
        .optional({ values: 'null' })
        .custom((val) => val === null || val === undefined || (Number.isInteger(Number(val)) && Number(val) >= 1))
        .withMessage('default_variation_id must be null or a positive integer'),
    (0, express_validator_1.body)('is_active').optional().isBoolean().toBoolean(),
    (0, express_validator_1.body)('is_featured').optional().isBoolean().toBoolean(),
];
exports.productIdParamValidator = [
    (0, express_validator_1.param)('id').isInt({ min: 1 }).withMessage('Valid product id is required').toInt(),
];
exports.productSlugParamValidator = [
    (0, express_validator_1.param)('slug').trim().notEmpty().withMessage('Slug is required'),
];
exports.listProductsValidator = [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).toInt(),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    (0, express_validator_1.query)('category_id').optional().isInt({ min: 1 }).toInt(),
    (0, express_validator_1.query)('product_type').optional().isIn(product_1.PRODUCT_TYPES),
    (0, express_validator_1.query)('min_price').optional().isFloat({ min: 0 }).toFloat(),
    (0, express_validator_1.query)('max_price').optional().isFloat({ min: 0 }).toFloat(),
    (0, express_validator_1.query)('on_sale').optional().isIn(['0', '1', 'true', 'false']),
    (0, express_validator_1.query)('search').optional().trim().isLength({ max: 100 }),
    (0, express_validator_1.query)('featured').optional().isIn(['0', '1', 'true', 'false']),
    (0, express_validator_1.query)('is_active').optional().isIn(['0', '1', 'true', 'false']),
    (0, express_validator_1.query)('sort').optional().isIn(['newest', 'price_asc', 'price_desc', 'name_asc', 'name_desc']),
];
exports.addImageValidator = [
    (0, express_validator_1.param)('id').isInt({ min: 1 }).toInt(),
    (0, express_validator_1.body)('alt_text').optional().trim().isLength({ max: 255 }),
    (0, express_validator_1.body)('sort_order').optional().isInt({ min: 0 }).toInt(),
];
exports.imageIdParamValidator = [
    (0, express_validator_1.param)('id').isInt({ min: 1 }).toInt(),
    (0, express_validator_1.param)('imageId').isInt({ min: 1 }).toInt(),
];
exports.addFileBodyValidator = [
    (0, express_validator_1.param)('id').isInt({ min: 1 }).toInt(),
    (0, express_validator_1.body)('file_name').optional().trim().isLength({ max: 255 }),
    (0, express_validator_1.body)('download_limit').optional().isInt({ min: 0 }).toInt(),
    (0, express_validator_1.body)('sort_order').optional().isInt({ min: 0 }).toInt(),
];
exports.fileIdParamValidator = [
    (0, express_validator_1.param)('id').isInt({ min: 1 }).toInt(),
    (0, express_validator_1.param)('fileId').isInt({ min: 1 }).toInt(),
];
exports.addLicensesValidator = [
    (0, express_validator_1.param)('id').isInt({ min: 1 }).toInt(),
    (0, express_validator_1.body)('keys').isArray().withMessage('keys must be an array'),
    (0, express_validator_1.body)('keys.*').isString().trim().notEmpty().withMessage('Each key must be a non-empty string'),
    (0, express_validator_1.body)('product_variation_id').optional().isInt({ min: 1 }).toInt(),
];
exports.listLicenseKeysValidator = [
    (0, express_validator_1.param)('id').isInt({ min: 1 }).toInt(),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    (0, express_validator_1.query)('offset').optional().isInt({ min: 0 }).toInt(),
    (0, express_validator_1.query)('status').optional().isIn(['all', 'available', 'used']),
    (0, express_validator_1.query)('product_variation_id').optional().isInt({ min: 1 }).toInt(),
];
exports.licenseKeyIdParamValidator = [
    (0, express_validator_1.param)('id').isInt({ min: 1 }).toInt(),
    (0, express_validator_1.param)('licenseId').isInt({ min: 1 }).toInt(),
];
exports.updateLicenseKeyValidator = [
    ...exports.licenseKeyIdParamValidator,
    (0, express_validator_1.body)('license_key').isString().trim().notEmpty().withMessage('license_key is required'),
    (0, express_validator_1.body)('product_variation_id').optional({ values: 'null' }).isInt({ min: 1 }).toInt(),
];
exports.replacePurchaseVariablesValidator = [
    (0, express_validator_1.param)('id').isInt({ min: 1 }).withMessage('Valid product id is required').toInt(),
    (0, express_validator_1.body)('variables').isArray().withMessage('variables must be an array'),
];
exports.replaceCatalogAttributesValidator = [
    (0, express_validator_1.param)('id').isInt({ min: 1 }).withMessage('Valid product id is required').toInt(),
    (0, express_validator_1.body)('attributes').isArray().withMessage('attributes must be an array'),
];
exports.replaceCatalogVariationsValidator = [
    (0, express_validator_1.param)('id').isInt({ min: 1 }).withMessage('Valid product id is required').toInt(),
    (0, express_validator_1.body)('variations').isArray().withMessage('variations must be an array'),
];
exports.generateCatalogVariationsValidator = [
    (0, express_validator_1.param)('id').isInt({ min: 1 }).withMessage('Valid product id is required').toInt(),
];
//# sourceMappingURL=productValidators.js.map