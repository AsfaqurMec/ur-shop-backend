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
exports.changeAdminPassword = changeAdminPassword;
exports.createAdmin = createAdmin;
const errorHandler_1 = require("../middlewares/errorHandler");
const adminAuthRepo = __importStar(require("../repositories/adminAuthRepository"));
const passwordHelpers_1 = require("../utils/passwordHelpers");
function toSafeAdmin(row) {
    return {
        id: row.id,
        email: row.email,
        name: row.name,
        email_verified_at: null,
        created_at: row.created_at.toISOString(),
        updated_at: row.updated_at.toISOString(),
        role: 'admin',
    };
}
async function changeAdminPassword(adminId, currentPassword, newPassword) {
    const admin = await adminAuthRepo.findAdminById(adminId);
    if (!admin) {
        throw new errorHandler_1.AppError(404, 'Admin not found');
    }
    const valid = await (0, passwordHelpers_1.comparePassword)(currentPassword, admin.password_hash);
    if (!valid) {
        throw new errorHandler_1.AppError(401, 'Current password is incorrect');
    }
    const passwordHash = await (0, passwordHelpers_1.hashPassword)(newPassword);
    await adminAuthRepo.updateAdminPassword(adminId, passwordHash);
    await adminAuthRepo.deleteAllAdminSessionsForAdmin(adminId);
    return { message: 'Password updated. Please sign in again.' };
}
async function createAdmin(email, password, name) {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await adminAuthRepo.findAdminByEmail(normalizedEmail);
    if (existing) {
        throw new errorHandler_1.AppError(409, 'An admin with this email already exists');
    }
    const passwordHash = await (0, passwordHelpers_1.hashPassword)(password);
    const displayName = (name?.trim() || normalizedEmail);
    const id = await adminAuthRepo.createAdmin(normalizedEmail, passwordHash, displayName, 'admin');
    const row = await adminAuthRepo.findAdminById(id);
    if (!row) {
        throw new errorHandler_1.AppError(500, 'Failed to create admin');
    }
    return { admin: toSafeAdmin(row) };
}
//# sourceMappingURL=adminAdminsService.js.map