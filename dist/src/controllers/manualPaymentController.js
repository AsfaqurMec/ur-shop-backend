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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listPaymentMethods = listPaymentMethods;
exports.submitProof = submitProof;
exports.getProofsForOrder = getProofsForOrder;
exports.listPendingProofs = listPendingProofs;
exports.listRecentProofsAdmin = listRecentProofsAdmin;
exports.downloadProofFile = downloadProofFile;
exports.approveProof = approveProof;
exports.rejectProof = rejectProof;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const apiResponse_1 = require("../utils/apiResponse");
const manualPaymentService = __importStar(require("../services/manualPaymentService"));
const paymentOptionService = __importStar(require("../services/paymentOptionService"));
const upload_1 = require("../middlewares/upload");
const cloudinaryService = __importStar(require("../services/cloudinaryService"));
const config_1 = require("../config");
const PROOF_EXT_MIME = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
};
async function listPaymentMethods(_req, res) {
    const methods = await paymentOptionService.listPublicPaymentMethods();
    return (0, apiResponse_1.sendSuccess)(res, { payment_methods: methods });
}
async function submitProof(req, res) {
    if (!req.user)
        return (0, apiResponse_1.sendError)(res, 'Unauthorized', 401);
    const userId = req.user.id;
    const orderId = Number(req.params.orderId);
    const file = req.file;
    if (!file)
        return (0, apiResponse_1.sendError)(res, 'Payment proof file (proof) is required', 400);
    const filePath = cloudinaryService.isCloudinaryConfigured()
        ? await cloudinaryService.uploadImageBuffer(file, config_1.env.cloudinary.proofFolder)
        : (0, upload_1.getPaymentProofRelativePath)(file.filename);
    const proof = await manualPaymentService.submitProof(userId, orderId, {
        sender_number: req.body.sender_number,
        transaction_id: req.body.transaction_id,
        paid_amount: req.body.paid_amount != null ? Number(req.body.paid_amount) : undefined,
    }, filePath);
    return (0, apiResponse_1.sendSuccess)(res, { proof }, 201, 'Payment proof submitted');
}
async function getProofsForOrder(req, res) {
    if (!req.user)
        return (0, apiResponse_1.sendError)(res, 'Unauthorized', 401);
    const orderId = Number(req.params.orderId);
    const proofs = await manualPaymentService.getProofsByOrderId(orderId, req.user.id);
    return (0, apiResponse_1.sendSuccess)(res, { proofs });
}
async function listPendingProofs(req, res) {
    const proofs = await manualPaymentService.listPendingProofs();
    return (0, apiResponse_1.sendSuccess)(res, { proofs });
}
async function listRecentProofsAdmin(req, res) {
    const limitRaw = req.query.limit != null ? Number(req.query.limit) : 30;
    const limit = Math.min(100, Math.max(1, Number.isFinite(limitRaw) ? limitRaw : 30));
    const offsetRaw = req.query.offset != null ? Number(req.query.offset) : 0;
    const offset = Math.max(0, Number.isFinite(offsetRaw) ? offsetRaw : 0);
    const excludePending = req.query.exclude_pending === 'true' || req.query.exclude_pending === '1';
    const rawStatus = typeof req.query.status === 'string' ? req.query.status : undefined;
    const allowed = ['pending', 'verified', 'rejected', 'all'];
    const statusFilter = rawStatus && allowed.includes(rawStatus)
        ? rawStatus
        : 'all';
    const status = statusFilter === 'all' ? undefined : statusFilter;
    const { proofs, total } = await manualPaymentService.listRecentProofsForAdmin(limit, offset, status, excludePending);
    return (0, apiResponse_1.sendSuccess)(res, { proofs, total });
}
async function downloadProofFile(req, res) {
    if (!req.user) {
        (0, apiResponse_1.sendError)(res, 'Unauthorized', 401);
        return;
    }
    const proofId = Number(req.params.id);
    const proof = await manualPaymentService.getProofById(proofId);
    if (!proof) {
        (0, apiResponse_1.sendError)(res, 'Payment proof not found', 404);
        return;
    }
    if (!proof.file_path) {
        (0, apiResponse_1.sendError)(res, 'This proof has no file attachment (transaction reference only).', 404);
        return;
    }
    if (/^https?:\/\//i.test(proof.file_path)) {
        res.redirect(proof.file_path);
        return;
    }
    const absolutePath = (0, upload_1.getPaymentProofAbsolutePath)(proof.file_path);
    if (!fs_1.default.existsSync(absolutePath)) {
        (0, apiResponse_1.sendError)(res, 'File not found', 404);
        return;
    }
    const ext = path_1.default.extname(proof.file_path).toLowerCase();
    const mime = PROOF_EXT_MIME[ext] ?? 'application/octet-stream';
    res.setHeader('Content-Type', mime);
    const safeName = `proof-${proofId}${ext || '.bin'}`;
    res.setHeader('Content-Disposition', `inline; filename="${safeName.replace(/"/g, '\\"')}"`);
    const stream = fs_1.default.createReadStream(absolutePath);
    stream.on('error', () => {
        if (!res.headersSent)
            res.status(500).end();
        else
            res.end();
    });
    stream.pipe(res);
}
async function approveProof(req, res) {
    if (!req.user)
        return (0, apiResponse_1.sendError)(res, 'Unauthorized', 401);
    const adminId = req.user.id;
    const proofId = Number(req.params.id);
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ?? req.socket?.remoteAddress ?? null;
    const result = await manualPaymentService.approveProof(adminId, proofId, ip);
    return (0, apiResponse_1.sendSuccess)(res, result, 200, 'Payment approved; delivery processing started');
}
async function rejectProof(req, res) {
    if (!req.user)
        return (0, apiResponse_1.sendError)(res, 'Unauthorized', 401);
    const adminId = req.user.id;
    const proofId = Number(req.params.id);
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ?? req.socket?.remoteAddress ?? null;
    const proof = await manualPaymentService.rejectProof(adminId, proofId, ip);
    return (0, apiResponse_1.sendSuccess)(res, { proof }, 200, 'Payment proof rejected');
}
//# sourceMappingURL=manualPaymentController.js.map