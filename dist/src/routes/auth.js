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
const authController = __importStar(require("../controllers/authController"));
const validate_1 = require("../middlewares/validate");
const auth_1 = require("../middlewares/auth");
const asyncHandler_1 = require("../utils/asyncHandler");
const authValidators_1 = require("../validators/authValidators");
const router = (0, express_1.Router)();
router.post('/register', (0, validate_1.validate)(authValidators_1.registerValidator), (0, asyncHandler_1.asyncHandler)(authController.register));
router.post('/guest-checkout', (0, validate_1.validate)(authValidators_1.guestCheckoutValidator), (0, asyncHandler_1.asyncHandler)(authController.guestCheckout));
router.post('/login', (0, validate_1.validate)(authValidators_1.loginValidator), (0, asyncHandler_1.asyncHandler)(authController.login));
router.post('/logout', auth_1.auth, (0, asyncHandler_1.asyncHandler)(authController.logout));
router.post('/refresh', (0, validate_1.validate)(authValidators_1.refreshValidator), (0, asyncHandler_1.asyncHandler)(authController.refresh));
router.post('/verify-email', (0, validate_1.validate)(authValidators_1.verifyEmailValidator), (0, asyncHandler_1.asyncHandler)(authController.verifyEmail));
router.get('/verify-email', (0, validate_1.validate)(authValidators_1.verifyEmailQueryValidator), (0, asyncHandler_1.asyncHandler)(authController.verifyEmail));
router.post('/forgot-password', (0, validate_1.validate)(authValidators_1.forgotPasswordValidator), (0, asyncHandler_1.asyncHandler)(authController.forgotPassword));
router.post('/reset-password', (0, validate_1.validate)(authValidators_1.resetPasswordValidator), (0, asyncHandler_1.asyncHandler)(authController.resetPassword));
router.get('/me', auth_1.auth, (0, asyncHandler_1.asyncHandler)(authController.getProfile));
router.patch('/me', auth_1.auth, (0, validate_1.validate)(authValidators_1.updateProfileValidator), (0, asyncHandler_1.asyncHandler)(authController.updateProfile));
exports.default = router;
//# sourceMappingURL=auth.js.map