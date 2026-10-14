"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const businessOwners_1 = __importDefault(require("./businessOwners"));
const shops_1 = __importDefault(require("./shops"));
const settings_1 = __importDefault(require("./settings"));
const knowledgeSources_1 = __importDefault(require("./knowledgeSources"));
const router = (0, express_1.Router)();
router.use('/business-owners', businessOwners_1.default);
router.use('/shops', shops_1.default);
router.use('/shops', settings_1.default);
router.use('/', knowledgeSources_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map