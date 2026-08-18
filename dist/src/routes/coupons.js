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
const couponController = __importStar(require("../controllers/couponController"));
const validate_1 = require("../middlewares/validate");
const auth_1 = require("../middlewares/auth");
const admin_1 = require("../middlewares/admin");
const asyncHandler_1 = require("../utils/asyncHandler");
const couponValidators_1 = require("../validators/couponValidators");
const router = (0, express_1.Router)();
// Public preview supports guest checkout; final validation runs again while the order is created.
router.post('/validate', (0, validate_1.validate)(couponValidators_1.validateCouponValidator), (0, asyncHandler_1.asyncHandler)(couponController.validate));
// Admin only
router.get('/', auth_1.auth, admin_1.admin, (0, asyncHandler_1.asyncHandler)(couponController.list));
router.get('/:id', auth_1.auth, admin_1.admin, (0, validate_1.validate)(couponValidators_1.couponIdParamValidator), (0, asyncHandler_1.asyncHandler)(couponController.getById));
router.post('/', auth_1.auth, admin_1.admin, (0, validate_1.validate)(couponValidators_1.createCouponValidator), (0, asyncHandler_1.asyncHandler)(couponController.create));
router.put('/:id', auth_1.auth, admin_1.admin, (0, validate_1.validate)(couponValidators_1.updateCouponValidator), (0, asyncHandler_1.asyncHandler)(couponController.update));
router.delete('/:id', auth_1.auth, admin_1.admin, (0, validate_1.validate)(couponValidators_1.couponIdParamValidator), (0, asyncHandler_1.asyncHandler)(couponController.remove));
router.patch('/:id/active', auth_1.auth, admin_1.admin, (0, validate_1.validate)(couponValidators_1.setActiveValidator), (0, asyncHandler_1.asyncHandler)(couponController.setActive));
exports.default = router;
//# sourceMappingURL=coupons.js.map