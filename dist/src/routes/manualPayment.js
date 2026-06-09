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
const manualPaymentController = __importStar(require("../controllers/manualPaymentController"));
const validate_1 = require("../middlewares/validate");
const auth_1 = require("../middlewares/auth");
const admin_1 = require("../middlewares/admin");
const asyncHandler_1 = require("../utils/asyncHandler");
const upload_1 = require("../middlewares/upload");
const bkashPaymentController = __importStar(require("../controllers/bkashPaymentController"));
const manualPaymentValidators_1 = require("../validators/manualPaymentValidators");
const router = (0, express_1.Router)();
// Public: list available payment methods
router.get('/methods', (0, asyncHandler_1.asyncHandler)(manualPaymentController.listPaymentMethods));
// Authenticated: complete bKash redirect checkout
router.post('/bkash/execute', auth_1.auth, (0, validate_1.validate)(manualPaymentValidators_1.bkashExecuteValidator), (0, asyncHandler_1.asyncHandler)(bkashPaymentController.executeBkash));
// Authenticated: submit proof for own order
router.post('/orders/:orderId/proof', auth_1.auth, (0, validate_1.validate)(manualPaymentValidators_1.submitProofValidator), (req, res, next) => (0, upload_1.uploadPaymentProof)(req, res, (err) => (err ? next(err) : next())), (0, asyncHandler_1.asyncHandler)(manualPaymentController.submitProof));
// Authenticated: get proofs for own order
router.get('/orders/:orderId/proofs', auth_1.auth, (0, validate_1.validate)(manualPaymentValidators_1.orderIdParamValidator), (0, asyncHandler_1.asyncHandler)(manualPaymentController.getProofsForOrder));
// Admin: list pending proofs, approve, reject
router.get('/proofs/pending', auth_1.auth, admin_1.admin, (0, asyncHandler_1.asyncHandler)(manualPaymentController.listPendingProofs));
router.get('/proofs/admin/recent', auth_1.auth, admin_1.admin, (0, asyncHandler_1.asyncHandler)(manualPaymentController.listRecentProofsAdmin));
router.get('/proofs/:id/file', auth_1.auth, admin_1.admin, (0, validate_1.validate)(manualPaymentValidators_1.proofIdParamValidator), (0, asyncHandler_1.asyncHandler)(manualPaymentController.downloadProofFile));
router.post('/proofs/:id/approve', auth_1.auth, admin_1.admin, (0, validate_1.validate)(manualPaymentValidators_1.proofIdParamValidator), (0, asyncHandler_1.asyncHandler)(manualPaymentController.approveProof));
router.post('/proofs/:id/reject', auth_1.auth, admin_1.admin, (0, validate_1.validate)(manualPaymentValidators_1.proofIdParamValidator), (0, asyncHandler_1.asyncHandler)(manualPaymentController.rejectProof));
exports.default = router;
//# sourceMappingURL=manualPayment.js.map