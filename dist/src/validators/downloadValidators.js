"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadFileValidator = exports.createTokenValidator = void 0;
const express_validator_1 = require("express-validator");
exports.createTokenValidator = [
    (0, express_validator_1.body)('entitlement_id')
        .isInt({ min: 1 })
        .withMessage('Valid entitlement_id is required')
        .toInt(),
];
exports.downloadFileValidator = [
    (0, express_validator_1.query)('token')
        .trim()
        .notEmpty()
        .withMessage('Download token is required')
        .isLength({ min: 32, max: 64 })
        .withMessage('Invalid token format'),
];
//# sourceMappingURL=downloadValidators.js.map