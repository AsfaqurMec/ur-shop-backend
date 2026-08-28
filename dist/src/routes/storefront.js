"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const storefrontFeedController_1 = require("../controllers/storefrontFeedController");
const router = (0, express_1.Router)();
router.get('/home-feed', storefrontFeedController_1.getHomeFeed);
exports.default = router;
//# sourceMappingURL=storefront.js.map