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
exports.listDownloadables = listDownloadables;
exports.createDownloadToken = createDownloadToken;
exports.downloadFile = downloadFile;
const apiResponse_1 = require("../utils/apiResponse");
const downloadService = __importStar(require("../services/downloadService"));
async function listDownloadables(req, res) {
    if (!req.user)
        return (0, apiResponse_1.sendError)(res, 'Unauthorized', 401);
    const items = await downloadService.listDownloadables(req.user.id);
    return (0, apiResponse_1.sendSuccess)(res, { items });
}
async function createDownloadToken(req, res) {
    if (!req.user)
        return (0, apiResponse_1.sendError)(res, 'Unauthorized', 401);
    const entitlementId = req.body.entitlement_id;
    const result = await downloadService.createDownloadToken(req.user.id, entitlementId);
    return (0, apiResponse_1.sendSuccess)(res, result, 200, 'Download link generated');
}
/** Token-based download (no auth middleware). Token is validated in service. */
async function downloadFile(req, res) {
    const token = req.query.token?.trim() ?? '';
    const ip = (req.ip || req.socket?.remoteAddress) ?? null;
    const userAgent = req.get('user-agent') ?? null;
    await downloadService.validateTokenAndStream(token, res, ip, userAgent);
}
//# sourceMappingURL=downloadController.js.map