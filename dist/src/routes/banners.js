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
const bannerController = __importStar(require("../controllers/bannerController"));
const validate_1 = require("../middlewares/validate");
const auth_1 = require("../middlewares/auth");
const admin_1 = require("../middlewares/admin");
const upload_1 = require("../middlewares/upload");
const asyncHandler_1 = require("../utils/asyncHandler");
const bannerValidators_1 = require("../validators/bannerValidators");
const router = (0, express_1.Router)();
router.get('/', (0, asyncHandler_1.asyncHandler)(bannerController.listPublic));
router.get('/admin/all', auth_1.auth, admin_1.admin, (0, asyncHandler_1.asyncHandler)(bannerController.listAdmin));
router.post('/', auth_1.auth, admin_1.admin, (req, res, next) => (0, upload_1.uploadBannerImage)(req, res, (err) => (err ? next(err) : next())), (0, validate_1.validate)(bannerValidators_1.createBannerValidator), (0, asyncHandler_1.asyncHandler)(bannerController.create));
router.put('/:id', auth_1.auth, admin_1.admin, (req, res, next) => (0, upload_1.uploadBannerImage)(req, res, (err) => (err ? next(err) : next())), (0, validate_1.validate)(bannerValidators_1.updateBannerValidator), (0, asyncHandler_1.asyncHandler)(bannerController.update));
router.delete('/:id', auth_1.auth, admin_1.admin, (0, validate_1.validate)(bannerValidators_1.deleteBannerValidator), (0, asyncHandler_1.asyncHandler)(bannerController.remove));
exports.default = router;
//# sourceMappingURL=banners.js.map