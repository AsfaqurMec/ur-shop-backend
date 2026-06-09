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
const deliveryController = __importStar(require("../controllers/deliveryController"));
const validate_1 = require("../middlewares/validate");
const auth_1 = require("../middlewares/auth");
const admin_1 = require("../middlewares/admin");
const asyncHandler_1 = require("../utils/asyncHandler");
const deliveryValidators_1 = require("../validators/deliveryValidators");
const router = (0, express_1.Router)();
// Admin: trigger delivery processing for an order, get delivery logs
router.post('/orders/:orderId/process', auth_1.auth, admin_1.admin, (0, validate_1.validate)(deliveryValidators_1.orderIdParamValidator), (0, asyncHandler_1.asyncHandler)(deliveryController.processDelivery));
router.get('/orders/:orderId/logs', auth_1.auth, (0, validate_1.validate)(deliveryValidators_1.orderIdParamValidator), (0, asyncHandler_1.asyncHandler)(deliveryController.getDeliveryLogs));
// Admin: fulfillment queue (subscription_manual, digital_service)
router.get('/fulfillment-queue', auth_1.auth, admin_1.admin, (0, asyncHandler_1.asyncHandler)(deliveryController.listFulfillmentQueue));
router.post('/fulfillment-queue/:id/fulfilled', auth_1.auth, admin_1.admin, (0, validate_1.validate)(deliveryValidators_1.markFulfillmentValidator), (0, asyncHandler_1.asyncHandler)(deliveryController.markFulfillmentFulfilled));
router.post('/fulfillment-queue/:id/failed', auth_1.auth, admin_1.admin, (0, validate_1.validate)(deliveryValidators_1.markFulfillmentValidator), (0, asyncHandler_1.asyncHandler)(deliveryController.markFulfillmentFailed));
exports.default = router;
//# sourceMappingURL=delivery.js.map