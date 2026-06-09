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
const reviewController = __importStar(require("../controllers/reviewController"));
const validate_1 = require("../middlewares/validate");
const auth_1 = require("../middlewares/auth");
const admin_1 = require("../middlewares/admin");
const asyncHandler_1 = require("../utils/asyncHandler");
const reviewValidators_1 = require("../validators/reviewValidators");
const router = (0, express_1.Router)();
// More specific paths first so /product/... and /admin/... are not matched as :reviewId
// ---- Public: product reviews list ----
router.get('/product/:productId', (0, validate_1.validate)(reviewValidators_1.listReviewsValidator), (0, asyncHandler_1.asyncHandler)(reviewController.listByProduct));
// ---- Customer (authenticated): submit under product ----
router.post('/product/:productId', auth_1.auth, (0, validate_1.validate)(reviewValidators_1.submitReviewValidator), (0, asyncHandler_1.asyncHandler)(reviewController.submitReview));
// ---- Admin: global list (before /admin/product and /admin/:reviewId) ----
router.get('/admin', auth_1.auth, admin_1.admin, (0, validate_1.validate)(reviewValidators_1.listAllAdminReviewsValidator), (0, asyncHandler_1.asyncHandler)(reviewController.listAllAdmin));
// ---- Admin: list all reviews for a product ----
router.get('/admin/product/:productId', auth_1.auth, admin_1.admin, (0, validate_1.validate)(reviewValidators_1.listReviewsValidator), (0, asyncHandler_1.asyncHandler)(reviewController.listByProductAdmin));
// ---- Admin: get any review ----
router.get('/admin/:reviewId', auth_1.auth, admin_1.admin, (0, validate_1.validate)(reviewValidators_1.reviewIdParamValidator), (0, asyncHandler_1.asyncHandler)(reviewController.getReviewDetailAdmin));
// ---- Admin: hide/unhide ----
router.patch('/:reviewId/hidden', auth_1.auth, admin_1.admin, (0, validate_1.validate)(reviewValidators_1.setHiddenValidator), (0, asyncHandler_1.asyncHandler)(reviewController.setHidden));
// ---- Customer: update own, get own ----
router.put('/:reviewId', auth_1.auth, (0, validate_1.validate)(reviewValidators_1.updateReviewValidator), (0, asyncHandler_1.asyncHandler)(reviewController.updateReview));
router.get('/:reviewId', auth_1.auth, (0, validate_1.validate)(reviewValidators_1.reviewIdParamValidator), (0, asyncHandler_1.asyncHandler)(reviewController.getReviewDetail));
exports.default = router;
//# sourceMappingURL=reviews.js.map