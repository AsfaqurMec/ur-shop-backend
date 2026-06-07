import { body, param, query } from 'express-validator';

const NAME_MAX = 255;
const SLUG_MAX = 255;

export const createCategoryValidator = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: NAME_MAX }).withMessage(`Name max ${NAME_MAX} characters`),
  body('slug').optional().trim().isLength({ max: SLUG_MAX }).withMessage(`Slug max ${SLUG_MAX} characters`),
  body('description').optional().trim(),
  body('parent_id').optional().isInt({ min: 1 }).withMessage('parent_id must be a positive integer').toInt(),
  body('sort_order').optional().isInt({ min: 0 }).withMessage('sort_order must be a non-negative integer').toInt(),
];

export const updateCategoryValidator = [
  param('id').isInt({ min: 1 }).withMessage('Valid category id is required').toInt(),
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty').isLength({ max: NAME_MAX }).withMessage(`Name max ${NAME_MAX} characters`),
  body('slug').optional().trim().isLength({ max: SLUG_MAX }).withMessage(`Slug max ${SLUG_MAX} characters`),
  body('description').optional().trim(),
  body('parent_id')
    .optional()
    .custom((val) => val === null || val === undefined || (Number.isInteger(Number(val)) && Number(val) >= 1))
    .withMessage('parent_id must be null or a positive integer'),
  body('sort_order').optional().isInt({ min: 0 }).withMessage('sort_order must be a non-negative integer').toInt(),
];

export const deleteCategoryValidator = [
  param('id').isInt({ min: 1 }).withMessage('Valid category id is required').toInt(),
];

export const getBySlugValidator = [
  param('slug').trim().notEmpty().withMessage('Slug is required'),
];

export const listCategoriesValidator = [
  query('nested').optional().isIn(['0', '1', 'true', 'false']).withMessage('nested must be 0, 1, true, or false'),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 200 }).toInt(),
];
