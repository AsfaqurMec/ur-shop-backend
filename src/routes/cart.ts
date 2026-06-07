import { Router } from 'express';
import * as cartController from '../controllers/cartController';
import { validate } from '../middlewares/validate';
import { auth } from '../middlewares/auth';
import { asyncHandler } from '../utils/asyncHandler';
import {
  addItemValidator,
  updateItemValidator,
  removeItemValidator,
} from '../validators/cartValidators';

const router = Router();

router.use(auth);

router.get('/', asyncHandler(cartController.getCart));
router.post('/items', validate(addItemValidator), asyncHandler(cartController.addItem));
router.put('/items/:itemId', validate(updateItemValidator), asyncHandler(cartController.updateItem));
router.delete('/items/:itemId', validate(removeItemValidator), asyncHandler(cartController.removeItem));
router.delete('/', asyncHandler(cartController.clearCart));

export default router;
