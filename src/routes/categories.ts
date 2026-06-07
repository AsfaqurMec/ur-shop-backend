import { Router } from 'express';
import * as categoryController from '../controllers/categoryController';
import { validate } from '../middlewares/validate';
import { auth } from '../middlewares/auth';
import { admin } from '../middlewares/admin';
import { asyncHandler } from '../utils/asyncHandler';
import {
  createCategoryValidator,
  updateCategoryValidator,
  deleteCategoryValidator,
  getBySlugValidator,
  listCategoriesValidator,
} from '../validators/categoryValidators';

const router = Router();

// Public
router.get('/', validate(listCategoriesValidator), asyncHandler(categoryController.list));
router.get('/:slug', validate(getBySlugValidator), asyncHandler(categoryController.getBySlug));

// Admin only
router.post('/', auth, admin, validate(createCategoryValidator), asyncHandler(categoryController.create));
router.put('/:id', auth, admin, validate(updateCategoryValidator), asyncHandler(categoryController.update));
router.delete('/:id', auth, admin, validate(deleteCategoryValidator), asyncHandler(categoryController.remove));

export default router;
