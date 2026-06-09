"use strict";
/**
 * Email module: layout helpers and template registry.
 * Use services/emailService for sending (sendTemplateEmail, sendWelcomeEmail, etc.).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderTemplate = exports.getTemplate = exports.mobileFieldLabel = exports.getStoreName = exports.paragraph = exports.link = exports.escapeAttr = exports.escapeHtml = exports.wrapHtml = void 0;
var layout_1 = require("./layout");
Object.defineProperty(exports, "wrapHtml", { enumerable: true, get: function () { return layout_1.wrapHtml; } });
Object.defineProperty(exports, "escapeHtml", { enumerable: true, get: function () { return layout_1.escapeHtml; } });
Object.defineProperty(exports, "escapeAttr", { enumerable: true, get: function () { return layout_1.escapeAttr; } });
Object.defineProperty(exports, "link", { enumerable: true, get: function () { return layout_1.link; } });
Object.defineProperty(exports, "paragraph", { enumerable: true, get: function () { return layout_1.paragraph; } });
Object.defineProperty(exports, "getStoreName", { enumerable: true, get: function () { return layout_1.getStoreName; } });
Object.defineProperty(exports, "mobileFieldLabel", { enumerable: true, get: function () { return layout_1.mobileFieldLabel; } });
var templates_1 = require("./templates");
Object.defineProperty(exports, "getTemplate", { enumerable: true, get: function () { return templates_1.getTemplate; } });
Object.defineProperty(exports, "renderTemplate", { enumerable: true, get: function () { return templates_1.renderTemplate; } });
//# sourceMappingURL=index.js.map