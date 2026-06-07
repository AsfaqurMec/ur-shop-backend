import { Router } from 'express';
import * as downloadController from '../controllers/downloadController';
import { validate } from '../middlewares/validate';
import { auth } from '../middlewares/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { createTokenValidator, downloadFileValidator } from '../validators/downloadValidators';

const router = Router();

/** List current user's downloadable items (authenticated). */
router.get('/', auth, asyncHandler(downloadController.listDownloadables));

/** Generate secure temporary download token (authenticated). */
router.post(
  '/token',
  auth,
  validate(createTokenValidator),
  asyncHandler(downloadController.createDownloadToken)
);

/** Stream file by token (no auth; token is the credential). */
router.get(
  '/file',
  validate(downloadFileValidator),
  asyncHandler(downloadController.downloadFile)
);

export default router;
