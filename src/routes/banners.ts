import { Router } from 'express';
import * as bannerController from '../controllers/bannerController';
import { validate } from '../middlewares/validate';
import { auth } from '../middlewares/auth';
import { admin } from '../middlewares/admin';
import { uploadBannerImage } from '../middlewares/upload';
import { asyncHandler } from '../utils/asyncHandler';
import { createBannerValidator, deleteBannerValidator, updateBannerValidator } from '../validators/bannerValidators';

const router = Router();

router.get('/', asyncHandler(bannerController.listPublic));
router.get('/admin/all', auth, admin, asyncHandler(bannerController.listAdmin));
router.post(
  '/',
  auth,
  admin,
  (req, res, next) => uploadBannerImage(req, res, (err) => (err ? next(err) : next())),
  validate(createBannerValidator),
  asyncHandler(bannerController.create)
);
router.put(
  '/:id',
  auth,
  admin,
  (req, res, next) => uploadBannerImage(req, res, (err) => (err ? next(err) : next())),
  validate(updateBannerValidator),
  asyncHandler(bannerController.update)
);
router.delete('/:id', auth, admin, validate(deleteBannerValidator), asyncHandler(bannerController.remove));

export default router;
