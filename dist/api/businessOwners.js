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
router.get('/', async (_req, res) => {
    try {
        const businessOwners = await repositories_1.businessOwnerRepository.findAll();
        res.json(businessOwners);
    }
    catch (error) {
        if (error instanceof Error) {
            logger_1.default.error('Error fetching business owners:', { error: error.message });
        }
        else {
            logger_1.default.error('Error fetching business owners:', { error: 'Unknown error' });
        }
        res.status(500).json({ error: 'Failed to fetch business owners' });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const businessOwner = await repositories_1.businessOwnerRepository.findById(id);
        if (!businessOwner) {
            res.status(404).json({ error: 'Business owner not found' });
            return;
        }
        res.json(businessOwner);
    }
    catch (error) {
        if (error instanceof Error) {
            logger_1.default.error('Error fetching business owner:', { error: error.message });
        }
        else {
            logger_1.default.error('Error fetching business owner:', { error: 'Unknown error' });
        }
        res.status(500).json({ error: 'Failed to fetch business owner' });
    }
});
router.post('/', async (req, res) => {
    try {
        const { name, email } = req.body;
        if (!name || !email) {
            res.status(400).json({ error: 'Name and email are required' });
            return;
        }
        const existingOwner = await repositories_1.businessOwnerRepository.findByEmail(email);
        if (existingOwner) {
            res.status(409).json({ error: 'Business owner with this email already exists' });
            return;
        }
        const businessOwner = await repositories_1.businessOwnerRepository.create({
            name,
            email,
        });
        res.status(201).json(businessOwner);
    }
    catch (error) {
        if (error instanceof Error) {
            logger_1.default.error('Error creating business owner:', { error: error.message });
        }
        else {
            logger_1.default.error('Error creating business owner:', { error: 'Unknown error' });
        }
        res.status(500).json({ error: 'Failed to create business owner' });
    }
});
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email } = req.body;
        const existingOwner = await repositories_1.businessOwnerRepository.findById(id);
        if (!existingOwner) {
            res.status(404).json({ error: 'Business owner not found' });
            return;
        }
        if (email && email !== existingOwner.email) {
            const ownerWithSameEmail = await repositories_1.businessOwnerRepository.findByEmail(email);
            if (ownerWithSameEmail) {
                res.status(409).json({ error: 'Business owner with this email already exists' });
                return;
            }
        }
        const businessOwner = await repositories_1.businessOwnerRepository.update(id, {
            name: name || existingOwner.name,
            email: email || existingOwner.email,
        });
        res.json(businessOwner);
    }
    catch (error) {
        if (error instanceof Error) {
            logger_1.default.error('Error updating business owner:', { error: error.message });
        }
        else {
            logger_1.default.error('Error updating business owner:', { error: 'Unknown error' });
        }
        res.status(500).json({ error: 'Failed to update business owner' });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const existingOwner = await repositories_1.businessOwnerRepository.findById(id);
        if (!existingOwner) {
            res.status(404).json({ error: 'Business owner not found' });
            return;
        }
        const shops = await repositories_1.shopRepository.findByBusinessOwnerId(id);
        if (shops.length > 0) {
            res.status(400).json({ error: 'Cannot delete business owner with existing shops' });
            return;
        }
        await repositories_1.businessOwnerRepository.delete(id);
        res.status(204).send();
    }
    catch (error) {
        if (error instanceof Error) {
            logger_1.default.error('Error deleting business owner:', { error: error.message });
        }
        else {
            logger_1.default.error('Error deleting business owner:', { error: 'Unknown error' });
        }
        res.status(500).json({ error: 'Failed to delete business owner' });
    }
});
exports.default = router;
//# sourceMappingURL=businessOwners.js.map