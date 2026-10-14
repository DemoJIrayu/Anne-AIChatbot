"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const repositories_1 = require("../db/postgres/repositories");
const middleware_1 = require("./middleware");
const logger_1 = __importDefault(require("../utils/logger"));
const router = (0, express_1.Router)();
router.use(middleware_1.authenticate);
router.get('/:shopId/settings', async (req, res) => {
    try {
        const { shopId } = req.params;
        const shop = await repositories_1.shopRepository.findById(shopId);
        if (!shop) {
            res.status(404).json({ error: 'Shop not found' });
            return;
        }
        const settings = await repositories_1.settingRepository.findByShopId(shopId);
        res.json(settings || {});
    }
    catch (error) {
        if (error instanceof Error) {
            logger_1.default.error('Error fetching settings:', { error: error.message });
        }
        else {
            logger_1.default.error('Error fetching settings:', { error: 'Unknown error' });
        }
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});
router.put('/:shopId/settings', async (req, res) => {
    try {
        const { shopId } = req.params;
        const { autoReply, welcomeMessage, systemPrompt, replyTone, confidenceThreshold, fallbackMessage, } = req.body;
        const shop = await repositories_1.shopRepository.findById(shopId);
        if (!shop) {
            res.status(404).json({ error: 'Shop not found' });
            return;
        }
        if (confidenceThreshold !== undefined && (confidenceThreshold < 0 || confidenceThreshold > 1)) {
            res.status(400).json({ error: 'Confidence threshold must be between 0 and 1' });
            return;
        }
        const settings = await repositories_1.settingRepository.updateByShopId(shopId, {
            autoReply,
            welcomeMessage,
            systemPrompt,
            replyTone,
            confidenceThreshold,
            fallbackMessage,
        });
        res.json(settings);
    }
    catch (error) {
        if (error instanceof Error) {
            logger_1.default.error('Error updating settings:', { error: error.message });
        }
        else {
            logger_1.default.error('Error updating settings:', { error: 'Unknown error' });
        }
        res.status(500).json({ error: 'Failed to update settings' });
    }
});
router.patch('/:shopId/settings/auto-reply', async (req, res) => {
    try {
        const { shopId } = req.params;
        const { enabled } = req.body;
        const shop = await repositories_1.shopRepository.findById(shopId);
        if (!shop) {
            res.status(404).json({ error: 'Shop not found' });
            return;
        }
        if (typeof enabled !== 'boolean') {
            res.status(400).json({ error: 'Enabled must be a boolean value' });
            return;
        }
        const settings = await repositories_1.settingRepository.updateByShopId(shopId, {
            autoReply: enabled,
        });
        res.json(settings);
    }
    catch (error) {
        if (error instanceof Error) {
            logger_1.default.error('Error toggling auto-reply:', { error: error.message });
        }
        else {
            logger_1.default.error('Error toggling auto-reply:', { error: 'Unknown error' });
        }
        res.status(500).json({ error: 'Failed to toggle auto-reply' });
    }
});
exports.default = router;
//# sourceMappingURL=settings.js.map