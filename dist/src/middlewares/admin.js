"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.admin = admin;
const apiResponse_1 = require("../utils/apiResponse");
const ADMIN_ROLE = 'admin';
/**
 * Admin middleware: requires req.user (from auth middleware) and role === 'admin'.
 * Must be used after auth middleware.
 */
function admin(req, res, next) {
    if (!req.user) {
        (0, apiResponse_1.sendError)(res, 'Unauthorized', 401, 'Authentication required');
        return;
    }
    if (req.user.role !== ADMIN_ROLE) {
        (0, apiResponse_1.sendError)(res, 'Forbidden', 403, 'Admin access required');
        return;
    }
    next();
}
//# sourceMappingURL=admin.js.map