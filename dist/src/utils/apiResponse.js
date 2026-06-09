"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSuccess = sendSuccess;
exports.sendError = sendError;
function sendSuccess(res, data, statusCode = 200, message) {
    return res.status(statusCode).json({
        success: true,
        data,
        ...(message && { message }),
    });
}
function sendError(res, error, statusCode = 500, message) {
    return res.status(statusCode).json({
        success: false,
        error,
        ...(message && { message }),
    });
}
//# sourceMappingURL=apiResponse.js.map