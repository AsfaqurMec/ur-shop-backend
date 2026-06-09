"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
const express_validator_1 = require("express-validator");
/**
 * Runs express-validator chains and returns 400 with validation errors if any.
 * Use after validators in route definitions.
 */
function validate(validations) {
    return async (req, res, next) => {
        await Promise.all(validations.map((v) => v.run(req)));
        const result = (0, express_validator_1.validationResult)(req);
        if (result.isEmpty()) {
            return next();
        }
        const errors = result.array().map((e) => ({
            field: 'path' in e ? e.path : ('param' in e ? e.param : 'field'),
            message: e.msg,
        }));
        res.status(400).json({
            success: false,
            error: 'Validation failed',
            message: errors.length === 1 ? errors[0].message : 'Invalid request',
            errors,
        });
    };
}
//# sourceMappingURL=validate.js.map