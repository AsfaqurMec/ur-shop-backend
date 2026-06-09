"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const healthController_1 = require("../controllers/healthController");
const asyncHandler_1 = require("../utils/asyncHandler");
const router = (0, express_1.Router)();
router.get('/', (0, asyncHandler_1.asyncHandler)(healthController_1.getHealth));
exports.default = router;
//# sourceMappingURL=health.js.map