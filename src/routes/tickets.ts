import { Router } from 'express';
import * as ticketController from '../controllers/ticketController';
import { validate } from '../middlewares/validate';
import { auth } from '../middlewares/auth';
import { admin } from '../middlewares/admin';
import { asyncHandler } from '../utils/asyncHandler';
import { uploadTicketAttachment } from '../middlewares/upload';
import {
  createTicketValidator,
  ticketIdParamValidator,
  replyValidator,
  updateStatusValidator,
  attachmentIdParamValidator,
  adminListTicketsValidator,
  customerListTicketsValidator,
  ticketCountQueryValidator,
  adminTicketCountQueryValidator,
} from '../validators/ticketValidators';

const router = Router();

// ---- Customer (authenticated) ----
router.post(
  '/',
  auth,
  (req, res, next) => uploadTicketAttachment(req, res, (err) => (err ? next(err) : next())),
  validate(createTicketValidator),
  asyncHandler(ticketController.createTicket)
);

router.get(
  '/count',
  auth,
  validate(ticketCountQueryValidator),
  asyncHandler(ticketController.getMyTicketCount)
);

router.get(
  '/',
  auth,
  validate(customerListTicketsValidator),
  asyncHandler(ticketController.listMyTickets)
);

// Attachment download before /:ticketId so "attachments" is not matched as ticketId
router.get(
  '/attachments/:attachmentId',
  auth,
  validate(attachmentIdParamValidator),
  asyncHandler(ticketController.downloadAttachment)
);

// Admin routes before /:ticketId so "admin" is not matched as ticketId
router.get(
  '/admin/all',
  auth,
  admin,
  validate(adminListTicketsValidator),
  asyncHandler(ticketController.listAllTickets)
);

router.get(
  '/admin/count',
  auth,
  admin,
  validate(adminTicketCountQueryValidator),
  asyncHandler(ticketController.getAdminTicketCount)
);

router.get(
  '/admin/:ticketId',
  auth,
  admin,
  validate(ticketIdParamValidator),
  asyncHandler(ticketController.getTicketDetailsAdmin)
);

router.patch(
  '/admin/:ticketId/status',
  auth,
  admin,
  validate(updateStatusValidator),
  asyncHandler(ticketController.updateStatus)
);

router.post(
  '/admin/:ticketId/reply',
  auth,
  admin,
  (req, res, next) => uploadTicketAttachment(req, res, (err) => (err ? next(err) : next())),
  validate(replyValidator),
  asyncHandler(ticketController.adminReply)
);

router.get(
  '/:ticketId',
  auth,
  validate(ticketIdParamValidator),
  asyncHandler(ticketController.getTicketDetails)
);

router.post(
  '/:ticketId/reply',
  auth,
  (req, res, next) => uploadTicketAttachment(req, res, (err) => (err ? next(err) : next())),
  validate(replyValidator),
  asyncHandler(ticketController.reply)
);

export default router;
