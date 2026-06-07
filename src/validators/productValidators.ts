import { body, param, query } from 'express-validator';
import { PRODUCT_TYPES } from '../types/product';

const NAME_MAX = 255;
const SLUG_MAX = 255;

export const createProductValidator = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: NAME_MAX }).withMessage(`Name max ${NAME_MAX} characters`),
  body('slug').optional().trim().isLength({ max: SLUG_MAX }).withMessage(`Slug max ${SLUG_MAX} characters`),
  body('description').optional().trim(),
  body('full_description').optional({ nullable: true }).isString().trim(),
  body('features').optional({ nullable: true }).isArray().withMessage('features must be an array'),
  body('features.*').optional().isString().trim(),
  body('category_id')
    .optional()
    .custom((val) => val === null || val === undefined || (Number.isInteger(Number(val)) && Number(val) >= 1))
    .withMessage('category_id must be null or a positive integer'),
  body('product_type').notEmpty().withMessage('product_type is required').isIn(PRODUCT_TYPES).withMessage(`product_type must be one of: ${PRODUCT_TYPES.join(', ')}`),
  body('manual_fulfillment_required').optional().isBoolean().toBoolean(),
  body('price').isFloat({ min: 0 }).withMessage('price must be a non-negative number').toFloat(),
  body('compare_at_price').optional().isFloat({ min: 0 }).toFloat(),
  body('is_active').optional().isBoolean().toBoolean(),
  body('is_featured').optional().isBoolean().toBoolean(),
];

export const updateProductValidator = [
  param('id').isInt({ min: 1 }).withMessage('Valid product id is required').toInt(),
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty').isLength({ max: NAME_MAX }).withMessage(`Name max ${NAME_MAX} characters`),
  body('slug').optional().trim().isLength({ max: SLUG_MAX }).withMessage(`Slug max ${SLUG_MAX} characters`),
  body('description').optional().trim(),
  body('full_description').optional({ nullable: true }).isString().trim(),
  body('features').optional({ nullable: true }).isArray().withMessage('features must be an array'),
  body('features.*').optional().isString().trim(),
  body('category_id').optional().custom((val) => val === null || (Number.isInteger(Number(val)) && Number(val) >= 1)),
  body('product_type').optional().isIn(PRODUCT_TYPES).withMessage(`product_type must be one of: ${PRODUCT_TYPES.join(', ')}`),
  body('manual_fulfillment_required').optional().isBoolean().toBoolean(),
  body('price').optional().isFloat({ min: 0 }).toFloat(),
  body('compare_at_price').optional().isFloat({ min: 0 }).toFloat(),
  body('sku').optional({ values: 'null' }).isString().trim().isLength({ max: 128 }),
  body('quantity').optional({ values: 'null' }).isInt({ min: 0 }).toInt(),
  body('default_variation_id')
    .optional({ values: 'null' })
    .custom((val) => val === null || val === undefined || (Number.isInteger(Number(val)) && Number(val) >= 1))
    .withMessage('default_variation_id must be null or a positive integer'),
  body('is_active').optional().isBoolean().toBoolean(),
  body('is_featured').optional().isBoolean().toBoolean(),
];

export const productIdParamValidator = [
  param('id').isInt({ min: 1 }).withMessage('Valid product id is required').toInt(),
];

export const productSlugParamValidator = [
  param('slug').trim().notEmpty().withMessage('Slug is required'),
];

export const listProductsValidator = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('category_id').optional().isInt({ min: 1 }).toInt(),
  query('product_type').optional().isIn(PRODUCT_TYPES),
  query('min_price').optional().isFloat({ min: 0 }).toFloat(),
  query('max_price').optional().isFloat({ min: 0 }).toFloat(),
  query('search').optional().trim().isLength({ max: 100 }),
  query('featured').optional().isIn(['0', '1', 'true', 'false']),
  query('is_active').optional().isIn(['0', '1', 'true', 'false']),
];

export const addImageValidator = [
  param('id').isInt({ min: 1 }).toInt(),
  body('alt_text').optional().trim().isLength({ max: 255 }),
  body('sort_order').optional().isInt({ min: 0 }).toInt(),
];

export const imageIdParamValidator = [
  param('id').isInt({ min: 1 }).toInt(),
  param('imageId').isInt({ min: 1 }).toInt(),
];

export const addFileBodyValidator = [
  param('id').isInt({ min: 1 }).toInt(),
  body('file_name').optional().trim().isLength({ max: 255 }),
  body('download_limit').optional().isInt({ min: 0 }).toInt(),
  body('sort_order').optional().isInt({ min: 0 }).toInt(),
];

export const fileIdParamValidator = [
  param('id').isInt({ min: 1 }).toInt(),
  param('fileId').isInt({ min: 1 }).toInt(),
];

export const addLicensesValidator = [
  param('id').isInt({ min: 1 }).toInt(),
  body('keys').isArray().withMessage('keys must be an array'),
  body('keys.*').isString().trim().notEmpty().withMessage('Each key must be a non-empty string'),
  body('product_variation_id').optional().isInt({ min: 1 }).toInt(),
];

export const listLicenseKeysValidator = [
  param('id').isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
  query('status').optional().isIn(['all', 'available', 'used']),
  query('product_variation_id').optional().isInt({ min: 1 }).toInt(),
];

export const licenseKeyIdParamValidator = [
  param('id').isInt({ min: 1 }).toInt(),
  param('licenseId').isInt({ min: 1 }).toInt(),
];

export const updateLicenseKeyValidator = [
  ...licenseKeyIdParamValidator,
  body('license_key').isString().trim().notEmpty().withMessage('license_key is required'),
  body('product_variation_id').optional({ values: 'null' }).isInt({ min: 1 }).toInt(),
];

export const replacePurchaseVariablesValidator = [
  param('id').isInt({ min: 1 }).withMessage('Valid product id is required').toInt(),
  body('variables').isArray().withMessage('variables must be an array'),
];

export const replaceCatalogAttributesValidator = [
  param('id').isInt({ min: 1 }).withMessage('Valid product id is required').toInt(),
  body('attributes').isArray().withMessage('attributes must be an array'),
];

export const replaceCatalogVariationsValidator = [
  param('id').isInt({ min: 1 }).withMessage('Valid product id is required').toInt(),
  body('variations').isArray().withMessage('variations must be an array'),
];

export const generateCatalogVariationsValidator = [
  param('id').isInt({ min: 1 }).withMessage('Valid product id is required').toInt(),
];
