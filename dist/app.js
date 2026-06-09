"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const config_1 = require("./src/config");
const middlewares_1 = require("./src/middlewares");
const routes_1 = __importDefault(require("./src/routes"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '5mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '5mb' }));
// Public uploads: product images only (payment proofs & ticket attachments stay private)
const uploadBase = (0, config_1.getUploadAbsoluteBase)();
app.use('/products/images', express_1.default.static(path_1.default.join(uploadBase, 'products', 'images')));
app.use('/settings/logos', express_1.default.static(path_1.default.join(uploadBase, 'settings', 'logos')));
app.use(config_1.env.apiPrefix, routes_1.default);
app.use(middlewares_1.errorHandler);
app.get('/', (req, res) => {
    res.send('Backend is running 🚀');
});
exports.default = app;
//# sourceMappingURL=app.js.map