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
router.get('/:shopId/knowledge-sources', async (req, res) => {
    try {
        const { shopId } = req.params;
        const shop = await repositories_1.shopRepository.findById(shopId);
        if (!shop) {
            res.status(404).json({ error: 'Shop not found' });
            return;
        }
        const knowledgeSources = await repositories_1.knowledgeSourceRepository.findByShopId(shopId);
        res.json(knowledgeSources);
    }
    catch (error) {
        if (error instanceof Error) {
            logger_1.default.error('Error fetching knowledge sources:', { error: error.message });
        }
        else {
            logger_1.default.error('Error fetching knowledge sources:', { error: 'Unknown error' });
        }
        res.status(500).json({ error: 'Failed to fetch knowledge sources' });
    }
});
router.post('/:shopId/knowledge-sources', async (req, res) => {
    try {
        const { shopId } = req.params;
        const { name, type, source } = req.body;
        const shop = await repositories_1.shopRepository.findById(shopId);
        if (!shop) {
            res.status(404).json({ error: 'Shop not found' });
            return;
        }
        if (!name || !type || !source) {
            res.status(400).json({ error: 'Name, type, and source are required' });
            return;
        }
        const validTypes = ['text', 'url'];
        if (!validTypes.includes(type)) {
            res.status(400).json({ error: `Type must be one of: ${validTypes.join(', ')}` });
            return;
        }
        const knowledgeSource = await repositories_1.knowledgeSourceRepository.create({
            shopId,
            name,
            type,
            source,
            status: 'pending',
        });
        res.status(201).json(knowledgeSource);
    }
    catch (error) {
        if (error instanceof Error) {
            logger_1.default.error('Error creating knowledge source:', { error: error.message });
        }
        else {
            logger_1.default.error('Error creating knowledge source:', { error: 'Unknown error' });
        }
        res.status(500).json({ error: 'Failed to create knowledge source' });
    }
});
router.get('/knowledge-sources/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const knowledgeSource = await repositories_1.knowledgeSourceRepository.findById(id);
        if (!knowledgeSource) {
            res.status(404).json({ error: 'Knowledge source not found' });
            return;
        }
        res.json(knowledgeSource);
    }
    catch (error) {
        if (error instanceof Error) {
            logger_1.default.error('Error fetching knowledge source:', { error: error.message });
        }
        else {
            logger_1.default.error('Error fetching knowledge source:', { error: 'Unknown error' });
        }
        res.status(500).json({ error: 'Failed to fetch knowledge source' });
    }
});
router.put('/knowledge-sources/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, type, source } = req.body;
        const existingSource = await repositories_1.knowledgeSourceRepository.findById(id);
        if (!existingSource) {
            res.status(404).json({ error: 'Knowledge source not found' });
            return;
        }
        if (type) {
            const validTypes = ['text', 'url'];
            if (!validTypes.includes(type)) {
                res.status(400).json({ error: `Type must be one of: ${validTypes.join(', ')}` });
                return;
            }
        }
        const knowledgeSource = await repositories_1.knowledgeSourceRepository.update(id, {
            name: name || existingSource.name,
            type: type || existingSource.type,
            source: source || existingSource.source,
        });
        res.json(knowledgeSource);
    }
    catch (error) {
        if (error instanceof Error) {
            logger_1.default.error('Error updating knowledge source:', { error: error.message });
        }
        else {
            logger_1.default.error('Error updating knowledge source:', { error: 'Unknown error' });
        }
        res.status(500).json({ error: 'Failed to update knowledge source' });
    }
});
router.delete('/knowledge-sources/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const existingSource = await repositories_1.knowledgeSourceRepository.findById(id);
        if (!existingSource) {
            res.status(404).json({ error: 'Knowledge source not found' });
            return;
        }
        await repositories_1.knowledgeSourceRepository.delete(id);
        res.status(204).send();
    }
    catch (error) {
        if (error instanceof Error) {
            logger_1.default.error('Error deleting knowledge source:', { error: error.message });
        }
        else {
            logger_1.default.error('Error deleting knowledge source:', { error: 'Unknown error' });
        }
        res.status(500).json({ error: 'Failed to delete knowledge source' });
    }
});
router.patch('/knowledge-sources/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const existingSource = await repositories_1.knowledgeSourceRepository.findById(id);
        if (!existingSource) {
            res.status(404).json({ error: 'Knowledge source not found' });
            return;
        }
        const validStatuses = ['pending', 'processing', 'ready', 'error'];
        if (!validStatuses.includes(status)) {
            res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
            return;
        }
        const knowledgeSource = await repositories_1.knowledgeSourceRepository.updateStatus(id, status);
        res.json(knowledgeSource);
    }
    catch (error) {
        if (error instanceof Error) {
            logger_1.default.error('Error updating knowledge source status:', { error: error.message });
        }
        else {
            logger_1.default.error('Error updating knowledge source status:', { error: 'Unknown error' });
        }
        res.status(500).json({ error: 'Failed to update knowledge source status' });
    }
});
exports.default = router;
//# sourceMappingURL=knowledgeSources.js.map