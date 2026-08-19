"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.continueCheckoutValidator = exports.guestAccountStatusValidator = exports.changePasswordValidator = exports.guestCheckoutValidator = exports.updateProfileValidator = exports.resetPasswordValidator = exports.forgotPasswordValidator = exports.verifyEmailQueryValidator = exports.verifyEmailValidator = exports.refreshValidator = exports.loginValidator = exports.registerValidator = void 0;
const express_validator_1 = require("express-validator");
const PASSWORD_MIN = 8;
const NAME_MAX = 255;
exports.registerValidator = [
    (0, express_validator_1.body)('identifier').trim().notEmpty().withMessage('Email or mobile number is required'),
    (0, express_validator_1.body)('password')
        .isLength({ min: PASSWORD_MIN })
        .withMessage(`Password must be at least ${PASSWORD_MIN} characters`),
    (0, express_validator_1.body)('name').optional().trim().isLength({ max: NAME_MAX }).withMessage(`Name max ${NAME_MAX} characters`),
];
exports.loginValidator = [
    (0, express_validator_1.body)('identifier').trim().notEmpty().withMessage('Email or mobile number is required'),
    (0, express_validator_1.body)('password').notEmpty().withMessage('Password is required'),
];
exports.refreshValidator = [
    (0, express_validator_1.body)('refreshToken').notEmpty().withMessage('Refresh token is required'),
];
exports.verifyEmailValidator = [
    (0, express_validator_1.body)('token').notEmpty().withMessage('Verification token is required'),
];
exports.verifyEmailQueryValidator = [
    (0, express_validator_1.query)('token').notEmpty().withMessage('Verification token is required'),
];
exports.forgotPasswordValidator = [
    (0, express_validator_1.body)('email').trim().isEmail().normalizeEmail().withMessage('Valid email is required'),
];
exports.resetPasswordValidator = [
    (0, express_validator_1.body)('token').notEmpty().withMessage('Reset token is required'),
    (0, express_validator_1.body)('password')
        .isLength({ min: PASSWORD_MIN })
        .withMessage(`Password must be at least ${PASSWORD_MIN} characters`),
];
exports.updateProfileValidator = [
    (0, express_validator_1.body)('name')
        .trim()
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ max: NAME_MAX })
        .withMessage(`Name max ${NAME_MAX} characters`),
    (0, express_validator_1.body)('mobile').optional({ values: 'null' }).trim().isLength({ max: 32 }).withMessage('Mobile max 32 characters'),
    (0, express_validator_1.body)('address').optional({ values: 'null' }).trim().isLength({ max: 1000 }).withMessage('Address max 1000 characters'),
];
exports.guestCheckoutValidator = [
    (0, express_validator_1.body)('name').trim().notEmpty().withMessage('Name is required').isLength({ max: NAME_MAX }),
    (0, express_validator_1.body)('mobile').trim().notEmpty().withMessage('Mobile number is required').isLength({ max: 32 }),
    (0, express_validator_1.body)('address').trim().notEmpty().withMessage('Address is required').isLength({ max: 1000 }),
];
exports.changePasswordValidator = [
    (0, express_validator_1.body)('current_password').notEmpty().withMessage('Current password is required'),
    (0, express_validator_1.body)('new_password').isLength({ min: PASSWORD_MIN }).withMessage(`New password must be at least ${PASSWORD_MIN} characters`),
];
exports.guestAccountStatusValidator = [
    (0, express_validator_1.body)('mobile').trim().notEmpty().withMessage('Mobile number is required').isLength({ max: 32 }),
];
exports.continueCheckoutValidator = [
    (0, express_validator_1.body)('mobile').trim().notEmpty().withMessage('Mobile number is required').isLength({ max: 32 }),
];
//# sourceMappingURL=authValidators.js.map