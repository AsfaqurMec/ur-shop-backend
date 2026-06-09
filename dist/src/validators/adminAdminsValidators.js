"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAdminValidator = exports.changeAdminPasswordValidator = void 0;
const express_validator_1 = require("express-validator");
const PASSWORD_MIN = 8;
const NAME_MAX = 255;
exports.changeAdminPasswordValidator = [
    (0, express_validator_1.body)('currentPassword').notEmpty().withMessage('Current password is required'),
    (0, express_validator_1.body)('newPassword')
        .isLength({ min: PASSWORD_MIN })
        .withMessage(`New password must be at least ${PASSWORD_MIN} characters`),
];
exports.createAdminValidator = [
    (0, express_validator_1.body)('email').trim().isEmail().normalizeEmail().withMessage('Valid email is required'),
    (0, express_validator_1.body)('password')
        .isLength({ min: PASSWORD_MIN })
        .withMessage(`Password must be at least ${PASSWORD_MIN} characters`),
    (0, express_validator_1.body)('name').optional().trim().isLength({ max: NAME_MAX }).withMessage(`Name max ${NAME_MAX} characters`),
];
//# sourceMappingURL=adminAdminsValidators.js.map