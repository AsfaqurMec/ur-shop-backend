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
const downloadController = __importStar(require("../controllers/downloadController"));
const validate_1 = require("../middlewares/validate");
const auth_1 = require("../middlewares/auth");
const asyncHandler_1 = require("../utils/asyncHandler");
const downloadValidators_1 = require("../validators/downloadValidators");
const router = (0, express_1.Router)();
/** List current user's downloadable items (authenticated). */
router.get('/', auth_1.auth, (0, asyncHandler_1.asyncHandler)(downloadController.listDownloadables));
/** Generate secure temporary download token (authenticated). */
router.post('/token', auth_1.auth, (0, validate_1.validate)(downloadValidators_1.createTokenValidator), (0, asyncHandler_1.asyncHandler)(downloadController.createDownloadToken));
/** Stream file by token (no auth; token is the credential). */
router.get('/file', (0, validate_1.validate)(downloadValidators_1.downloadFileValidator), (0, asyncHandler_1.asyncHandler)(downloadController.downloadFile));
exports.default = router;
//# sourceMappingURL=downloads.js.map