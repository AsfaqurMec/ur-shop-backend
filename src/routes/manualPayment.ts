import { Router } from 'express';
import * as manualPaymentController from '../controllers/manualPaymentController';
import { validate } from '../middlewares/validate';
import { auth } from '../middlewares/auth';
import { admin } from '../middlewares/admin';
import { asyncHandler } from '../utils/asyncHandler';
import { uploadPaymentProof } from '../middlewares/upload';
import * as bkashPaymentController from '../controllers/bkashPaymentController';
import {
  submitProofValidator,
  proofIdParamValidator,
  orderIdParamValidator,
  bkashExecuteValidator,
} from '../validators/manualPaymentValidators';

const router = Router();

// Public: list available payment methods
router.get('/methods', asyncHandler(manualPaymentController.listPaymentMethods));

// Authenticated: complete bKash redirect checkout
router.post(
  '/bkash/execute',
  auth,
  validate(bkashExecuteValidator),
  asyncHandler(bkashPaymentController.executeBkash)
);

// Authenticated: submit proof for own order
router.post(
  '/orders/:orderId/proof',
  auth,
  validate(submitProofValidator),
  (req, res, next) => uploadPaymentProof(req, res, (err) => (err ? next(err) : next())),
  asyncHandler(manualPaymentController.submitProof)
);

// Authenticated: get proofs for own order
router.get(
  '/orders/:orderId/proofs',
  auth,
  validate(orderIdParamValidator),
  asyncHandler(manualPaymentController.getProofsForOrder)
);

// Admin: list pending proofs, approve, reject
router.get(
  '/proofs/pending',
  auth,
  admin,
  asyncHandler(manualPaymentController.listPendingProofs)
);
router.get(
  '/proofs/admin/recent',
  auth,
  admin,
  asyncHandler(manualPaymentController.listRecentProofsAdmin)
);
router.get(
  '/proofs/:id/file',
  auth,
  admin,
  validate(proofIdParamValidator),
  asyncHandler(manualPaymentController.downloadProofFile)
);
router.post(
  '/proofs/:id/approve',
  auth,
  admin,
  validate(proofIdParamValidator),
  asyncHandler(manualPaymentController.approveProof)
);
router.post(
  '/proofs/:id/reject',
  auth,
  admin,
  validate(proofIdParamValidator),
  asyncHandler(manualPaymentController.rejectProof)
);

export default router;
