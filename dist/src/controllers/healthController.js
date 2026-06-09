"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHealth = getHealth;
const apiResponse_1 = require("../utils/apiResponse");
function getHealth(_req, res) {
    return (0, apiResponse_1.sendSuccess)(res, {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
}
//# sourceMappingURL=healthController.js.map