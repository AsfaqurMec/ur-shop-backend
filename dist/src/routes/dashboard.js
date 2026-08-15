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
const dashboardController = __importStar(require("../controllers/dashboardController"));
const validate_1 = require("../middlewares/validate");
const auth_1 = require("../middlewares/auth");
const asyncHandler_1 = require("../utils/asyncHandler");
const dashboardValidators_1 = require("../validators/dashboardValidators");
const router = (0, express_1.Router)();
router.use(auth_1.auth);
/** My orders list (paginated). */
router.get('/orders', (0, validate_1.validate)(dashboardValidators_1.ordersListValidator), (0, asyncHandler_1.asyncHandler)(dashboardController.getMyOrders));
/** Order details (must own order). */
router.get('/orders/:orderId/invoice', (0, validate_1.validate)(dashboardValidators_1.orderIdParamValidator), (0, asyncHandler_1.asyncHandler)(dashboardController.downloadOrderInvoice));
router.get('/orders/:orderId', (0, validate_1.validate)(dashboardValidators_1.orderIdParamValidator), (0, asyncHandler_1.asyncHandler)(dashboardController.getOrderDetails));
/** My downloadable items. */
router.get('/downloads', (0, asyncHandler_1.asyncHandler)(dashboardController.getMyDownloads));
/** My assigned license keys. */
router.get('/licenses', (0, asyncHandler_1.asyncHandler)(dashboardController.getMyLicenses));
/** My subscriptions. */
router.get('/subscriptions', (0, asyncHandler_1.asyncHandler)(dashboardController.getMySubscriptions));
router.get('/subscriptions/pending', (0, asyncHandler_1.asyncHandler)(dashboardController.getMyPendingSubscriptions));
/** My delivered items (downloads + licenses + subscriptions + fulfilled). */
router.get('/delivered', (0, asyncHandler_1.asyncHandler)(dashboardController.getMyDeliveredItems));
/** Dashboard summary counts. */
router.get('/summary', (0, asyncHandler_1.asyncHandler)(dashboardController.getDashboardSummary));
exports.default = router;
//# sourceMappingURL=dashboard.js.map