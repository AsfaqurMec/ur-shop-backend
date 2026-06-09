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
exports.listDownloadables = listDownloadables;
exports.createDownloadToken = createDownloadToken;
exports.validateTokenAndStream = validateTokenAndStream;
const crypto_1 = __importDefault(require("crypto"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const errorHandler_1 = require("../middlewares/errorHandler");
const upload_1 = require("../middlewares/upload");
const entitlementRepo = __importStar(require("../repositories/downloadEntitlementRepository"));
const downloadTokenRepo = __importStar(require("../repositories/downloadTokenRepository"));
const downloadRepo = __importStar(require("../repositories/downloadRepository"));
const productRepo = __importStar(require("../repositories/productRepository"));
const TOKEN_EXPIRY_MINUTES = 15;
const TOKEN_MAX_USES = 1;
/** List current user's downloadable items (entitlements with file info and download count/limit). */
async function listDownloadables(userId) {
    const rows = await entitlementRepo.findEntitlementsForUser(userId);
    const now = new Date();
    return rows.map((r) => ({
        entitlement_id: r.entitlement_id,
        order_item_id: r.order_item_id,
        order_id: r.order_id,
        order_number: r.order_number,
        product_id: r.product_id,
        product_name: r.product_name,
        product_file_id: r.product_file_id,
        file_name: r.file_name,
        file_size: r.file_size,
        download_count: r.download_count,
        download_limit: r.download_limit,
        expires_at: r.expires_at ? r.expires_at.toISOString() : null,
        created_at: r.created_at.toISOString(),
    }));
}
/** Generate a secure temporary download token for an entitlement owned by the user. */
async function createDownloadToken(userId, entitlementId) {
    const entitlement = await entitlementRepo.findByIdForUser(entitlementId, userId);
    if (!entitlement)
        throw new errorHandler_1.AppError(404, 'Entitlement not found');
    if (entitlement.expires_at && new Date(entitlement.expires_at) <= new Date()) {
        throw new errorHandler_1.AppError(400, 'This download has expired');
    }
    const file = await productRepo.findProductFileByIdOnly(entitlement.product_file_id);
    if (!file)
        throw new errorHandler_1.AppError(404, 'File not found');
    const downloadCount = await downloadRepo.countByOrderItemAndFile(entitlement.order_item_id, entitlement.product_file_id);
    if (file.download_limit != null && downloadCount >= file.download_limit) {
        throw new errorHandler_1.AppError(400, 'Download limit reached for this file');
    }
    const token = crypto_1.default.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);
    await downloadTokenRepo.create(null, {
        token,
        entitlement_id: entitlementId,
        user_id: userId,
        expires_at: expiresAt,
        max_uses: TOKEN_MAX_USES,
    });
    // Path relative to API root (same base as the frontend PUBLIC_API_URL, which already includes apiPrefix).
    const url = `/downloads/file?token=${encodeURIComponent(token)}`;
    return {
        token,
        expires_at: expiresAt.toISOString(),
        url,
    };
}
/** Validate token, record download, increment token use, then stream file. Call from controller. */
async function validateTokenAndStream(token, res, ip, userAgent) {
    const row = await downloadTokenRepo.findByToken(token);
    if (!row)
        throw new errorHandler_1.AppError(404, 'Invalid or expired download link');
    const now = new Date();
    if (new Date(row.expires_at) <= now)
        throw new errorHandler_1.AppError(404, 'Invalid or expired download link');
    if (row.use_count >= row.max_uses)
        throw new errorHandler_1.AppError(404, 'Invalid or expired download link');
    const entitlement = await entitlementRepo.findByIdForUser(row.entitlement_id, row.user_id);
    if (!entitlement)
        throw new errorHandler_1.AppError(404, 'Entitlement not found');
    if (entitlement.expires_at && new Date(entitlement.expires_at) <= now) {
        throw new errorHandler_1.AppError(400, 'This download has expired');
    }
    const file = await productRepo.findProductFileByIdOnly(entitlement.product_file_id);
    if (!file)
        throw new errorHandler_1.AppError(404, 'File not found');
    const downloadCount = await downloadRepo.countByOrderItemAndFile(entitlement.order_item_id, entitlement.product_file_id);
    if (file.download_limit != null && downloadCount >= file.download_limit) {
        throw new errorHandler_1.AppError(400, 'Download limit reached for this file');
    }
    const absolutePath = (0, upload_1.getProductFileAbsolutePath)(file.file_path);
    if (!fs_1.default.existsSync(absolutePath))
        throw new errorHandler_1.AppError(404, 'File not found on server');
    const incremented = await downloadTokenRepo.incrementUseCount(null, row.id);
    if (!incremented) {
        throw new errorHandler_1.AppError(404, 'Invalid or expired download link');
    }
    await downloadRepo.create(null, {
        order_item_id: entitlement.order_item_id,
        user_id: row.user_id,
        product_file_id: entitlement.product_file_id,
        ip,
        user_agent: userAgent,
    });
    const filename = file.file_name || path_1.default.basename(file.file_path);
    res.setHeader('Content-Disposition', `attachment; filename="${filename.replace(/"/g, '\\"')}"`);
    if (file.file_size != null)
        res.setHeader('Content-Length', String(file.file_size));
    const stream = fs_1.default.createReadStream(absolutePath);
    stream.on('error', (err) => {
        if (!res.headersSent)
            res.status(500).end();
        else
            res.end();
    });
    stream.pipe(res);
}
//# sourceMappingURL=downloadService.js.map