"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ticketController = __importStar(require("../controllers/ticketController"));
const validate_1 = require("../middlewares/validate");
const auth_1 = require("../middlewares/auth");
const admin_1 = require("../middlewares/admin");
const asyncHandler_1 = require("../utils/asyncHandler");
const upload_1 = require("../middlewares/upload");
const ticketValidators_1 = require("../validators/ticketValidators");
const router = (0, express_1.Router)();
// ---- Customer (authenticated) ----
router.post('/', auth_1.auth, (req, res, next) => (0, upload_1.uploadTicketAttachment)(req, res, (err) => (err ? next(err) : next())), (0, validate_1.validate)(ticketValidators_1.createTicketValidator), (0, asyncHandler_1.asyncHandler)(ticketController.createTicket));
router.get('/count', auth_1.auth, (0, validate_1.validate)(ticketValidators_1.ticketCountQueryValidator), (0, asyncHandler_1.asyncHandler)(ticketController.getMyTicketCount));
router.get('/', auth_1.auth, (0, validate_1.validate)(ticketValidators_1.customerListTicketsValidator), (0, asyncHandler_1.asyncHandler)(ticketController.listMyTickets));
// Attachment download before /:ticketId so "attachments" is not matched as ticketId
router.get('/attachments/:attachmentId', auth_1.auth, (0, validate_1.validate)(ticketValidators_1.attachmentIdParamValidator), (0, asyncHandler_1.asyncHandler)(ticketController.downloadAttachment));
// Admin routes before /:ticketId so "admin" is not matched as ticketId
router.get('/admin/all', auth_1.auth, admin_1.admin, (0, validate_1.validate)(ticketValidators_1.adminListTicketsValidator), (0, asyncHandler_1.asyncHandler)(ticketController.listAllTickets));
router.get('/admin/count', auth_1.auth, admin_1.admin, (0, validate_1.validate)(ticketValidators_1.adminTicketCountQueryValidator), (0, asyncHandler_1.asyncHandler)(ticketController.getAdminTicketCount));
router.get('/admin/:ticketId', auth_1.auth, admin_1.admin, (0, validate_1.validate)(ticketValidators_1.ticketIdParamValidator), (0, asyncHandler_1.asyncHandler)(ticketController.getTicketDetailsAdmin));
router.patch('/admin/:ticketId/status', auth_1.auth, admin_1.admin, (0, validate_1.validate)(ticketValidators_1.updateStatusValidator), (0, asyncHandler_1.asyncHandler)(ticketController.updateStatus));
router.post('/admin/:ticketId/reply', auth_1.auth, admin_1.admin, (req, res, next) => (0, upload_1.uploadTicketAttachment)(req, res, (err) => (err ? next(err) : next())), (0, validate_1.validate)(ticketValidators_1.replyValidator), (0, asyncHandler_1.asyncHandler)(ticketController.adminReply));
router.get('/:ticketId', auth_1.auth, (0, validate_1.validate)(ticketValidators_1.ticketIdParamValidator), (0, asyncHandler_1.asyncHandler)(ticketController.getTicketDetails));
router.post('/:ticketId/reply', auth_1.auth, (req, res, next) => (0, upload_1.uploadTicketAttachment)(req, res, (err) => (err ? next(err) : next())), (0, validate_1.validate)(ticketValidators_1.replyValidator), (0, asyncHandler_1.asyncHandler)(ticketController.reply));
exports.default = router;
//# sourceMappingURL=tickets.js.map