import { body, param, query } from 'express-validator';

const TICKET_STATUSES = ['open', 'answered', 'customer_reply', 'closed'] as const;

export const createTicketValidator = [
  body('subject').trim().notEmpty().withMessage('Subject is required').isLength({ max: 255 }),
  body('message').trim().notEmpty().withMessage('Message is required'),
  body('order_id').optional().isInt({ min: 1 }).toInt(),
];

export const ticketIdParamValidator = [
  param('ticketId').isInt({ min: 1 }).withMessage('Valid ticket id is required').toInt(),
];

export const replyValidator = [
  param('ticketId').isInt({ min: 1 }).toInt(),
  body('message').trim().notEmpty().withMessage('Message is required'),
];

export const updateStatusValidator = [
  param('ticketId').isInt({ min: 1 }).toInt(),
  body('status')
    .isIn(TICKET_STATUSES)
    .withMessage(`Status must be one of: ${TICKET_STATUSES.join(', ')}`),
];

export const attachmentIdParamValidator = [
  param('attachmentId').isInt({ min: 1 }).withMessage('Valid attachment id is required').toInt(),
];

export const adminListTicketsValidator = [
  query('status').optional().isIn(TICKET_STATUSES),
  query('limit').optional().isInt({ min: 1, max: 200 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
];

/** Customer GET /tickets — same query params as admin list. */
export const customerListTicketsValidator = [
  query('status').optional().isIn(TICKET_STATUSES),
  query('limit').optional().isInt({ min: 1, max: 200 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
];

export const ticketCountQueryValidator = [
  query('status').optional().isIn(TICKET_STATUSES),
];

export const adminTicketCountQueryValidator = [
  query('status').optional().isIn(TICKET_STATUSES),
];
