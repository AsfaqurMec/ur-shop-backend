"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminTicketCountQueryValidator = exports.ticketCountQueryValidator = exports.customerListTicketsValidator = exports.adminListTicketsValidator = exports.attachmentIdParamValidator = exports.updateStatusValidator = exports.replyValidator = exports.ticketIdParamValidator = exports.createTicketValidator = void 0;
const express_validator_1 = require("express-validator");
const TICKET_STATUSES = ['open', 'answered', 'customer_reply', 'closed'];
exports.createTicketValidator = [
    (0, express_validator_1.body)('subject').trim().notEmpty().withMessage('Subject is required').isLength({ max: 255 }),
    (0, express_validator_1.body)('message').trim().notEmpty().withMessage('Message is required'),
    (0, express_validator_1.body)('order_id').optional().isInt({ min: 1 }).toInt(),
];
exports.ticketIdParamValidator = [
    (0, express_validator_1.param)('ticketId').isInt({ min: 1 }).withMessage('Valid ticket id is required').toInt(),
];
exports.replyValidator = [
    (0, express_validator_1.param)('ticketId').isInt({ min: 1 }).toInt(),
    (0, express_validator_1.body)('message').trim().notEmpty().withMessage('Message is required'),
];
exports.updateStatusValidator = [
    (0, express_validator_1.param)('ticketId').isInt({ min: 1 }).toInt(),
    (0, express_validator_1.body)('status')
        .isIn(TICKET_STATUSES)
        .withMessage(`Status must be one of: ${TICKET_STATUSES.join(', ')}`),
];
exports.attachmentIdParamValidator = [
    (0, express_validator_1.param)('attachmentId').isInt({ min: 1 }).withMessage('Valid attachment id is required').toInt(),
];
exports.adminListTicketsValidator = [
    (0, express_validator_1.query)('status').optional().isIn(TICKET_STATUSES),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 200 }).toInt(),
    (0, express_validator_1.query)('offset').optional().isInt({ min: 0 }).toInt(),
];
/** Customer GET /tickets — same query params as admin list. */
exports.customerListTicketsValidator = [
    (0, express_validator_1.query)('status').optional().isIn(TICKET_STATUSES),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 200 }).toInt(),
    (0, express_validator_1.query)('offset').optional().isInt({ min: 0 }).toInt(),
];
exports.ticketCountQueryValidator = [
    (0, express_validator_1.query)('status').optional().isIn(TICKET_STATUSES),
];
exports.adminTicketCountQueryValidator = [
    (0, express_validator_1.query)('status').optional().isIn(TICKET_STATUSES),
];
//# sourceMappingURL=ticketValidators.js.map