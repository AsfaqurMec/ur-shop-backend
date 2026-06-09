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
const adminAdminsController = __importStar(require("../controllers/adminAdminsController"));
const validate_1 = require("../middlewares/validate");
const auth_1 = require("../middlewares/auth");
const admin_1 = require("../middlewares/admin");
const asyncHandler_1 = require("../utils/asyncHandler");
const adminAdminsValidators_1 = require("../validators/adminAdminsValidators");
const router = (0, express_1.Router)();
router.use(auth_1.auth);
router.use(admin_1.admin);
/** Current admin: verify current password, set new password, invalidate all admin sessions for this account. */
router.post('/me/password', (0, validate_1.validate)(adminAdminsValidators_1.changeAdminPasswordValidator), (0, asyncHandler_1.asyncHandler)(adminAdminsController.changePassword));
/** Create another admin account (same privileges). */
router.post('/', (0, validate_1.validate)(adminAdminsValidators_1.createAdminValidator), (0, asyncHandler_1.asyncHandler)(adminAdminsController.createAdmin));
exports.default = router;
//# sourceMappingURL=adminAdmins.js.map