"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
exports.errorHandler = errorHandler;
const multer_1 = __importDefault(require("multer"));
const apiResponse_1 = require("../utils/apiResponse");
const config_1 = require("../config");
class AppError extends Error {
    statusCode;
    isOperational;
    constructor(statusCode, message, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Object.setPrototypeOf(this, AppError.prototype);
        this.name = 'AppError';
    }
}
exports.AppError = AppError;
function getMessageForError(err) {
    const code = err.code;
    if (code === 'ECONNREFUSED') {
        return 'Database unavailable. Check MONGODB_URL in .env and make sure MongoDB is reachable.';
    }
    if (code === 'MongoServerSelectionError') {
        return 'MongoDB connection failed. Check MONGODB_URL in .env.';
    }
    return 'Internal server error';
}
function errorHandler(err, _req, res, _next) {
    if (err instanceof multer_1.default.MulterError) {
        const msg = err.code === 'LIMIT_FILE_SIZE'
            ? 'File is too large for the configured upload limit.'
            : err.code === 'LIMIT_UNEXPECTED_FILE'
                ? 'Unexpected file field. Use field name "image" or "images" (one file only per product).'
                : err.message;
        (0, apiResponse_1.sendError)(res, msg, 400);
        return;
    }
    const isAppError = err instanceof AppError;
    const statusCode = isAppError ? err.statusCode : 500;
    const message = isAppError ? err.message : getMessageForError(err);
    if (!isAppError && config_1.env.nodeEnv !== 'test') {
        console.error('[Error]', err);
    }
    (0, apiResponse_1.sendError)(res, message, statusCode);
}
//# sourceMappingURL=errorHandler.js.map