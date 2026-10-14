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
router.get('/', async (req, res) => {
    try {
        const shops = await repositories_1.shopRepository.findAll();
        res.json(shops);
    }
    catch (error) {
        if (error instanceof Error) {
            logger_1.default.error('Error fetching shops:', { error: error.message });
        }
        else {
            logger_1.default.error('Error fetching shops:', { error: 'Unknown error' });
        }
        res.status(500).json({ error: 'Failed to fetch shops' });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const shop = await repositories_1.shopRepository.findById(id);
        if (!shop) {
            res.status(404).json({ error: 'Shop not found' });
            return;
        }
        res.json(shop);
    }
    catch (error) {
        if (error instanceof Error) {
            logger_1.default.error('Error fetching shop:', { error: error.message });
        }
        else {
            logger_1.default.error('Error fetching shop:', { error: 'Unknown error' });
        }
        res.status(500).json({ error: 'Failed to fetch shop' });
    }
});
router.post('/', async (req, res) => {
    try {
        const { name, businessOwnerId } = req.body;
        if (!name || !businessOwnerId) {
            res.status(400).json({ error: 'Name and businessOwnerId are required' });
            return;
        }
        const businessOwnerRepo = new repositories_1.BusinessOwnerRepository();
        const businessOwner = await businessOwnerRepo.findById(businessOwnerId);
        if (!businessOwner) {
            res.status(400).json({ error: 'Business owner not found' });
            return;
        }
        const shop = await repositories_1.shopRepository.create({
            name,
            businessOwnerId,
        });
        res.status(201).json(shop);
    }
    catch (error) {
        if (error instanceof Error) {
            logger_1.default.error('Error creating shop:', { error: error.message });
        }
        else {
            logger_1.default.error('Error creating shop:', { error: 'Unknown error' });
        }
        res.status(500).json({ error: 'Failed to create shop' });
    }
});
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const existingShop = await repositories_1.shopRepository.findById(id);
        if (!existingShop) {
            res.status(404).json({ error: 'Shop not found' });
            return;
        }
        const shop = await repositories_1.shopRepository.update(id, {
            name: name || existingShop.name,
        });
        res.json(shop);
    }
    catch (error) {
        if (error instanceof Error) {
            logger_1.default.error('Error updating shop:', { error: error.message });
        }
        else {
            logger_1.default.error('Error updating shop:', { error: 'Unknown error' });
        }
        res.status(500).json({ error: 'Failed to update shop' });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const existingShop = await repositories_1.shopRepository.findById(id);
        if (!existingShop) {
            res.status(404).json({ error: 'Shop not found' });
            return;
        }
        await repositories_1.shopRepository.delete(id);
        res.status(204).send();
    }
    catch (error) {
        if (error instanceof Error) {
            logger_1.default.error('Error deleting shop:', { error: error.message });
        }
        else {
            logger_1.default.error('Error deleting shop:', { error: 'Unknown error' });
        }
        res.status(500).json({ error: 'Failed to delete shop' });
    }
});
exports.default = router;
//# sourceMappingURL=shops.js.map