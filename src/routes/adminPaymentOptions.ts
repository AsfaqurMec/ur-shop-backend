import { Router } from 'express';
import * as paymentOptionAdminController from '../controllers/paymentOptionAdminController';
import { validate } from '../middlewares/validate';
import { auth } from '../middlewares/auth';
import { admin } from '../middlewares/admin';
import { asyncHandler } from '../utils/asyncHandler';
import {
  createPaymentOptionValidator,
  updatePaymentOptionValidator,
  paymentOptionIdParamValidator,
} from '../validators/paymentOptionValidators';

const router = Router();

router.use(auth);
router.use(admin);

router.get('/', asyncHandler(paymentOptionAdminController.list));
router.post('/', validate(createPaymentOptionValidator), asyncHandler(paymentOptionAdminController.create));
router.patch(
  '/:id',
  validate([...paymentOptionIdParamValidator, ...updatePaymentOptionValidator]),
  asyncHandler(paymentOptionAdminController.update)
);
router.delete('/:id', validate(paymentOptionIdParamValidator), asyncHandler(paymentOptionAdminController.remove));

export default router;
