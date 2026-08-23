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
exports.register = register;
exports.login = login;
exports.logout = logout;
exports.refresh = refresh;
exports.verifyEmail = verifyEmail;
exports.forgotPassword = forgotPassword;
exports.resetPassword = resetPassword;
exports.getProfile = getProfile;
exports.updateProfileName = updateProfileName;
exports.updateUserProfile = updateUserProfile;
exports.guestCheckout = guestCheckout;
exports.changePassword = changePassword;
exports.hasAccountForMobile = hasAccountForMobile;
exports.continueCheckout = continueCheckout;
const crypto_1 = __importDefault(require("crypto"));
const errorHandler_1 = require("../middlewares/errorHandler");
const authRepo = __importStar(require("../repositories/authRepository"));
const adminAuthRepo = __importStar(require("../repositories/adminAuthRepository"));
const passwordHelpers_1 = require("../utils/passwordHelpers");
const tokenHelpers_1 = require("../utils/tokenHelpers");
const emailService = __importStar(require("./emailService"));
const config_1 = require("../config");
const bengali_1 = require("../utils/bengali");
const VERIFICATION_EXPIRY_HOURS = 24;
const PASSWORD_RESET_EXPIRY_HOURS = 1;
function toSafeUser(row) {
    return {
        id: row.id,
        email: row.email,
        name: row.name,
        mobile: row.mobile?.trim() || null,
        address: row.address?.trim() || null,
        email_verified_at: row.email_verified_at ? row.email_verified_at.toISOString() : null,
        created_at: row.created_at.toISOString(),
        updated_at: row.updated_at.toISOString(),
        role: 'user',
        needs_password_change: row.needs_password_change === true,
    };
}
function toSafeAdmin(row) {
    return {
        id: row.id,
        email: row.email,
        name: row.name,
        mobile: null,
        address: null,
        email_verified_at: null,
        created_at: row.created_at.toISOString(),
        updated_at: row.updated_at.toISOString(),
        role: 'admin',
        needs_password_change: false,
    };
}
function randomToken() {
    return crypto_1.default.randomBytes(32).toString('hex');
}
async function register(identifier, password, name, verificationBaseUrl) {
    const normalizedIdentifier = (0, bengali_1.normalizeBengaliNumerals)(identifier.trim()).toLowerCase();
    const isEmail = normalizedIdentifier.includes('@');
    const mobile = isEmail ? null : ((0, bengali_1.normalizeBdMobile)(normalizedIdentifier) || normalizedIdentifier);
    const email = isEmail ? normalizedIdentifier : `${mobile}@guest.local`;
    const existing = isEmail ? await authRepo.findUserByEmail(email) : await authRepo.findUserByMobile(mobile);
    if (existing) {
        throw new errorHandler_1.AppError(409, 'Email already registered');
    }
    const passwordHash = await (0, passwordHelpers_1.hashPassword)(password);
    const userId = await authRepo.createUser(email, passwordHash, name.trim() || identifier, { mobile });
    const user = await authRepo.findUserById(userId);
    if (!user)
        throw new errorHandler_1.AppError(500, 'Failed to create user');
    const token = randomToken();
    const expiresAt = new Date(Date.now() + VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000);
    if (isEmail)
        await authRepo.createEmailVerification(userId, email, token, expiresAt);
    if (isEmail && verificationBaseUrl) {
        const verifyUrl = `${verificationBaseUrl.replace(/\/$/, '')}?token=${token}`;
        await emailService.sendVerifyEmail(email, { verifyUrl });
    }
    if (isEmail && config_1.env.mail.sendWelcomeEmail) {
        const base = config_1.env.frontendUrl.replace(/\/$/, '');
        const loginUrl = base ? `${base}/login` : undefined;
        const shopUrl = base ? `${base}/shop` : undefined;
        await emailService.sendWelcomeEmail(email, {
            name: user.name,
            email: user.email,
            loginUrl,
            shopUrl,
        });
    }
    return {
        user: toSafeUser(user),
        message: isEmail && verificationBaseUrl
            ? 'Registration successful. Please check your email to verify your account.'
            : 'Registration successful. You can now sign in.',
    };
}
async function login(identifier, password, ip, userAgent) {
    const normalizedIdentifier = (0, bengali_1.normalizeBengaliNumerals)(identifier.trim());
    const isEmail = normalizedIdentifier.includes('@');
    const normalizedMobile = isEmail ? null : ((0, bengali_1.normalizeBdMobile)(normalizedIdentifier) || normalizedIdentifier);
    const user = isEmail
        ? await authRepo.findUserByEmail(normalizedIdentifier.toLowerCase())
        : await authRepo.findUserByMobile(normalizedMobile);
    if (user) {
        const valid = await (0, passwordHelpers_1.comparePassword)(password, user.password_hash);
        if (!valid) {
            throw new errorHandler_1.AppError(401, 'Invalid email or password');
        }
        const expiresAt = (0, tokenHelpers_1.getRefreshTokenExpiry)();
        const placeholderHash = (0, tokenHelpers_1.hashToken)(crypto_1.default.randomBytes(24).toString('hex'));
        const sessionId = await authRepo.createSession(user.id, placeholderHash, expiresAt, ip, userAgent);
        const signedRefreshToken = (0, tokenHelpers_1.generateRefreshToken)({
            id: user.id,
            email: user.email,
            sessionId,
        });
        const tokenHash = (0, tokenHelpers_1.hashToken)(signedRefreshToken);
        await authRepo.updateSessionTokenHash(sessionId, tokenHash);
        const accessToken = (0, tokenHelpers_1.generateAccessToken)({
            id: user.id,
            email: user.email,
            sessionId,
        });
        return {
            user: toSafeUser(user),
            accessToken,
            refreshToken: signedRefreshToken,
            expiresAt: expiresAt.toISOString(),
        };
    }
    const admin = await adminAuthRepo.findAdminByEmail(normalizedIdentifier);
    if (!admin) {
        throw new errorHandler_1.AppError(401, 'Invalid email or password');
    }
    const adminValid = await (0, passwordHelpers_1.comparePassword)(password, admin.password_hash);
    if (!adminValid) {
        throw new errorHandler_1.AppError(401, 'Invalid email or password');
    }
    const adminExpiresAt = (0, tokenHelpers_1.getRefreshTokenExpiry)();
    const adminPlaceholderHash = (0, tokenHelpers_1.hashToken)(crypto_1.default.randomBytes(24).toString('hex'));
    const adminSessionId = await adminAuthRepo.createAdminSession(admin.id, adminPlaceholderHash, adminExpiresAt, ip, userAgent);
    const adminRefreshToken = (0, tokenHelpers_1.generateRefreshToken)({
        id: admin.id,
        email: admin.email,
        sessionId: adminSessionId,
    }, tokenHelpers_1.ROLE_ADMIN);
    const adminTokenHash = (0, tokenHelpers_1.hashToken)(adminRefreshToken);
    await adminAuthRepo.updateAdminSessionTokenHash(adminSessionId, adminTokenHash);
    const adminAccessToken = (0, tokenHelpers_1.generateAccessToken)({
        id: admin.id,
        email: admin.email,
        sessionId: adminSessionId,
    }, tokenHelpers_1.ROLE_ADMIN);
    return {
        user: toSafeAdmin(admin),
        accessToken: adminAccessToken,
        refreshToken: adminRefreshToken,
        expiresAt: adminExpiresAt.toISOString(),
    };
}
async function logout(sessionId, role) {
    if (role === tokenHelpers_1.ROLE_ADMIN) {
        await adminAuthRepo.deleteAdminSessionById(sessionId);
        return;
    }
    await authRepo.deleteSessionById(sessionId);
}
async function refresh(refreshToken, ip, userAgent) {
    let payload;
    try {
        payload = (0, tokenHelpers_1.verifyRefreshToken)(refreshToken);
    }
    catch {
        throw new errorHandler_1.AppError(401, 'Invalid or expired refresh token');
    }
    const tokenHash = (0, tokenHelpers_1.hashToken)(refreshToken);
    if (payload.role === tokenHelpers_1.ROLE_ADMIN) {
        const session = await adminAuthRepo.findAdminSessionByTokenHash(tokenHash);
        if (!session || new Date() > session.expires_at) {
            throw new errorHandler_1.AppError(401, 'Session expired or invalid');
        }
        if (session.id !== payload.sessionId) {
            throw new errorHandler_1.AppError(401, 'Invalid refresh token');
        }
        const admin = await adminAuthRepo.findAdminById(payload.id);
        if (!admin) {
            await adminAuthRepo.deleteAdminSessionById(session.id);
            throw new errorHandler_1.AppError(401, 'Account no longer exists');
        }
        await adminAuthRepo.deleteAdminSessionById(session.id);
        const expiresAt = (0, tokenHelpers_1.getRefreshTokenExpiry)();
        const placeholderHash = (0, tokenHelpers_1.hashToken)(crypto_1.default.randomBytes(24).toString('hex'));
        const newSessionId = await adminAuthRepo.createAdminSession(admin.id, placeholderHash, expiresAt, ip, userAgent);
        const signedRefreshToken = (0, tokenHelpers_1.generateRefreshToken)({
            id: admin.id,
            email: admin.email,
            sessionId: newSessionId,
        }, tokenHelpers_1.ROLE_ADMIN);
        const newTokenHash = (0, tokenHelpers_1.hashToken)(signedRefreshToken);
        await adminAuthRepo.updateAdminSessionTokenHash(newSessionId, newTokenHash);
        const accessToken = (0, tokenHelpers_1.generateAccessToken)({
            id: admin.id,
            email: admin.email,
            sessionId: newSessionId,
        }, tokenHelpers_1.ROLE_ADMIN);
        return {
            user: toSafeAdmin(admin),
            accessToken,
            refreshToken: signedRefreshToken,
            expiresAt: expiresAt.toISOString(),
        };
    }
    const session = await authRepo.findSessionByTokenHash(tokenHash);
    if (!session || new Date() > session.expires_at) {
        throw new errorHandler_1.AppError(401, 'Session expired or invalid');
    }
    if (session.id !== payload.sessionId) {
        throw new errorHandler_1.AppError(401, 'Invalid refresh token');
    }
    const user = await authRepo.findUserById(payload.id);
    if (!user) {
        await authRepo.deleteSessionById(session.id);
        throw new errorHandler_1.AppError(401, 'User no longer exists');
    }
    await authRepo.deleteSessionById(session.id);
    const expiresAt = (0, tokenHelpers_1.getRefreshTokenExpiry)();
    const newSessionId = await authRepo.createSession(user.id, '', expiresAt, ip, userAgent);
    const signedRefreshToken = (0, tokenHelpers_1.generateRefreshToken)({
        id: user.id,
        email: user.email,
        sessionId: newSessionId,
    });
    const newTokenHash = (0, tokenHelpers_1.hashToken)(signedRefreshToken);
    await authRepo.updateSessionTokenHash(newSessionId, newTokenHash);
    const accessToken = (0, tokenHelpers_1.generateAccessToken)({
        id: user.id,
        email: user.email,
        sessionId: newSessionId,
    });
    return {
        user: toSafeUser(user),
        accessToken,
        refreshToken: signedRefreshToken,
        expiresAt: expiresAt.toISOString(),
    };
}
async function verifyEmail(token) {
    const verification = await authRepo.findEmailVerificationByToken(token.trim());
    if (!verification) {
        throw new errorHandler_1.AppError(400, 'Invalid or expired verification token');
    }
    // Idempotent: link open twice, React Strict Mode double-fetch, or user clicks Verify again.
    if (verification.verified_at) {
        const user = await authRepo.findUserById(verification.user_id);
        if (!user)
            throw new errorHandler_1.AppError(500, 'User not found');
        return { user: toSafeUser(user) };
    }
    if (new Date() > verification.expires_at) {
        throw new errorHandler_1.AppError(400, 'Verification token has expired');
    }
    await authRepo.markEmailVerificationVerified(verification.id);
    await authRepo.updateUserEmailVerified(verification.user_id);
    const user = await authRepo.findUserById(verification.user_id);
    if (!user)
        throw new errorHandler_1.AppError(500, 'User not found');
    return { user: toSafeUser(user) };
}
async function forgotPassword(email, resetBaseUrl) {
    const user = await authRepo.findUserByEmail(email);
    if (!user) {
        return { message: 'If an account exists with this email, you will receive a reset link.' };
    }
    const token = randomToken();
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRY_HOURS * 60 * 60 * 1000);
    await authRepo.createPasswordReset(user.id, token, expiresAt);
    if (resetBaseUrl) {
        const resetUrl = `${resetBaseUrl.replace(/\/$/, '')}?token=${token}`;
        await emailService.sendPasswordResetEmail(user.email, {
            resetUrl,
            expiresInHours: PASSWORD_RESET_EXPIRY_HOURS,
        });
    }
    return {
        message: 'If an account exists with this email, you will receive a reset link.',
    };
}
async function resetPassword(token, newPassword) {
    const reset = await authRepo.findPasswordResetByToken(token);
    if (!reset) {
        throw new errorHandler_1.AppError(400, 'Invalid or expired reset token');
    }
    if (new Date() > reset.expires_at) {
        throw new errorHandler_1.AppError(400, 'Reset token has expired');
    }
    const passwordHash = await (0, passwordHelpers_1.hashPassword)(newPassword);
    await authRepo.updateUserPassword(reset.user_id, passwordHash);
    await authRepo.markPasswordResetUsed(reset.id);
    const user = await authRepo.findUserById(reset.user_id);
    if (user) {
        const loginUrl = config_1.env.frontendUrl ? `${config_1.env.frontendUrl}/login` : undefined;
        void emailService
            .sendPasswordChangedEmail(user.email, {
            name: user.name?.trim() || undefined,
            loginUrl,
        })
            .catch((err) => {
            if (config_1.env.nodeEnv !== 'test')
                console.error('[Mail] Password-changed email failed:', err);
        });
    }
    return { message: 'Password has been reset successfully.' };
}
async function getProfile(userId, role) {
    if (role === tokenHelpers_1.ROLE_ADMIN) {
        const admin = await adminAuthRepo.findAdminById(userId);
        if (!admin) {
            throw new errorHandler_1.AppError(404, 'User not found');
        }
        return toSafeAdmin(admin);
    }
    const user = await authRepo.findUserById(userId);
    if (!user) {
        throw new errorHandler_1.AppError(404, 'User not found');
    }
    return toSafeUser(user);
}
async function updateProfileName(userId, role, name) {
    const trimmed = name.trim();
    if (!trimmed) {
        throw new errorHandler_1.AppError(400, 'Name is required');
    }
    if (role === tokenHelpers_1.ROLE_ADMIN) {
        const admin = await adminAuthRepo.findAdminById(userId);
        if (!admin) {
            throw new errorHandler_1.AppError(404, 'User not found');
        }
        await adminAuthRepo.updateAdminName(userId, trimmed);
    }
    else {
        const user = await authRepo.findUserById(userId);
        if (!user) {
            throw new errorHandler_1.AppError(404, 'User not found');
        }
        await authRepo.updateUserName(userId, trimmed);
    }
    return getProfile(userId, role);
}
async function updateUserProfile(userId, role, data) {
    const trimmedName = data.name.trim();
    if (!trimmedName) {
        throw new errorHandler_1.AppError(400, 'Name is required');
    }
    if (role === tokenHelpers_1.ROLE_ADMIN) {
        return updateProfileName(userId, role, trimmedName);
    }
    const user = await authRepo.findUserById(userId);
    if (!user) {
        throw new errorHandler_1.AppError(404, 'User not found');
    }
    const mobile = data.mobile !== undefined ? (data.mobile?.trim() || null) : undefined;
    const address = data.address !== undefined ? (data.address?.trim() || null) : undefined;
    if (mobile !== undefined && !mobile) {
        throw new errorHandler_1.AppError(400, 'Mobile number is required');
    }
    if (address !== undefined && !address) {
        throw new errorHandler_1.AppError(400, 'Address is required');
    }
    await authRepo.updateUserContact(userId, {
        name: trimmedName,
        ...(mobile !== undefined ? { mobile } : {}),
        ...(address !== undefined ? { address } : {}),
    });
    return getProfile(userId, role);
}
async function createUserSession(user, ip, userAgent) {
    const fullUser = await authRepo.findUserById(user.id);
    if (!fullUser)
        throw new errorHandler_1.AppError(500, 'User not found');
    const expiresAt = (0, tokenHelpers_1.getRefreshTokenExpiry)();
    const placeholderHash = (0, tokenHelpers_1.hashToken)(crypto_1.default.randomBytes(24).toString('hex'));
    const sessionId = await authRepo.createSession(fullUser.id, placeholderHash, expiresAt, ip, userAgent);
    const signedRefreshToken = (0, tokenHelpers_1.generateRefreshToken)({
        id: fullUser.id,
        email: fullUser.email,
        sessionId,
    });
    const tokenHash = (0, tokenHelpers_1.hashToken)(signedRefreshToken);
    await authRepo.updateSessionTokenHash(sessionId, tokenHash);
    const accessToken = (0, tokenHelpers_1.generateAccessToken)({
        id: fullUser.id,
        email: fullUser.email,
        sessionId,
    });
    return {
        user: toSafeUser(fullUser),
        accessToken,
        refreshToken: signedRefreshToken,
        expiresAt: expiresAt.toISOString(),
    };
}
/** Register or sign in a guest shopper (password = email) and return auth tokens. */
async function guestCheckout(name, mobile, address, ip, userAgent) {
    const rawMobile = (0, bengali_1.normalizeBengaliNumerals)(mobile.trim());
    const trimmedMobile = (0, bengali_1.normalizeBdMobile)(rawMobile) || rawMobile;
    const generatedEmail = `${trimmedMobile}@guest.local`;
    const trimmedName = name.trim() || trimmedMobile;
    const trimmedAddress = address.trim();
    if (!trimmedMobile)
        throw new errorHandler_1.AppError(400, 'Mobile number is required');
    if (!trimmedAddress)
        throw new errorHandler_1.AppError(400, 'Address is required');
    const existing = await authRepo.findUserByMobile(trimmedMobile);
    if (existing) {
        const valid = await (0, passwordHelpers_1.comparePassword)(trimmedMobile.slice(0, 5), existing.password_hash);
        if (!valid) {
            throw new errorHandler_1.AppError(409, 'An account with this email already exists. Please log in to continue.');
        }
        return createUserSession(existing, ip, userAgent);
    }
    const passwordHash = await (0, passwordHelpers_1.hashPassword)(trimmedMobile.slice(0, 5));
    const userId = await authRepo.createUser(generatedEmail, passwordHash, trimmedName, {
        mobile: trimmedMobile,
        address: trimmedAddress,
        needsPasswordChange: true,
    });
    const user = await authRepo.findUserById(userId);
    if (!user)
        throw new errorHandler_1.AppError(500, 'Failed to create user');
    return createUserSession(user, ip, userAgent);
}
async function changePassword(userId, role, currentPassword, newPassword) {
    if (role === tokenHelpers_1.ROLE_ADMIN)
        throw new errorHandler_1.AppError(403, 'Password changes are not available here');
    const user = await authRepo.findUserById(userId);
    if (!user)
        throw new errorHandler_1.AppError(404, 'User not found');
    if (!(await (0, passwordHelpers_1.comparePassword)(currentPassword, user.password_hash)))
        throw new errorHandler_1.AppError(400, 'Current password is incorrect');
    if (currentPassword === newPassword)
        throw new errorHandler_1.AppError(400, 'Choose a different new password');
    await authRepo.updateUserPassword(userId, await (0, passwordHelpers_1.hashPassword)(newPassword));
}
async function hasAccountForMobile(mobile) {
    const rawMobile = (0, bengali_1.normalizeBengaliNumerals)(mobile.trim());
    const trimmedMobile = (0, bengali_1.normalizeBdMobile)(rawMobile) || rawMobile;
    return Boolean(await authRepo.findUserByMobile(trimmedMobile));
}
/** Sign in an existing account by mobile for guest checkout continuation (no password required). */
async function continueCheckout(mobile, ip, userAgent) {
    const rawMobile = (0, bengali_1.normalizeBengaliNumerals)(mobile.trim());
    const trimmedMobile = (0, bengali_1.normalizeBdMobile)(rawMobile) || rawMobile;
    if (!trimmedMobile)
        throw new errorHandler_1.AppError(400, 'Mobile number is required');
    const existing = await authRepo.findUserByMobile(trimmedMobile);
    if (!existing)
        throw new errorHandler_1.AppError(404, 'No account found for this mobile number');
    if (!existing.address?.trim()) {
        throw new errorHandler_1.AppError(400, 'This account has no saved address. Please log in to update your profile.');
    }
    return createUserSession(existing, ip, userAgent);
}
//# sourceMappingURL=authService.js.map