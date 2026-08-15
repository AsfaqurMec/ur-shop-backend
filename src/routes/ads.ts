import { Router } from 'express';
import * as controller from '../controllers/adController';
import { auth } from '../middlewares/auth'; import { admin } from '../middlewares/admin'; import { uploadBannerImage } from '../middlewares/upload'; import { asyncHandler } from '../utils/asyncHandler';
const router = Router();
router.get('/', asyncHandler(controller.listPublic)); router.get('/admin/all', auth, admin, asyncHandler(controller.listAdmin));
router.post('/', auth, admin, (req, res, next) => uploadBannerImage(req, res, (err) => err ? next(err) : next()), asyncHandler(controller.create));
router.put('/:id', auth, admin, (req, res, next) => uploadBannerImage(req, res, (err) => err ? next(err) : next()), asyncHandler(controller.update));
router.delete('/:id', auth, admin, asyncHandler(controller.remove)); export default router;
