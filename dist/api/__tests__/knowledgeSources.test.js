"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const express_1 = __importDefault(require("express"));
const supertest_1 = __importDefault(require("supertest"));
const knowledgeSources_1 = __importDefault(require("../knowledgeSources"));
const repositories_1 = require("../../db/postgres/repositories");
vitest_1.vi.mock('../../db/postgres/repositories', () => ({
    knowledgeSourceRepository: {
        findByShopId: vitest_1.vi.fn(),
        create: vitest_1.vi.fn(),
        findById: vitest_1.vi.fn(),
        update: vitest_1.vi.fn(),
        delete: vitest_1.vi.fn(),
        updateStatus: vitest_1.vi.fn(),
    },
    shopRepository: {
        findById: vitest_1.vi.fn(),
    }
}));
vitest_1.vi.mock('../../utils/logger', () => ({
    default: {
        info: vitest_1.vi.fn(),
        warn: vitest_1.vi.fn(),
        error: vitest_1.vi.fn(),
    }
}));
(0, vitest_1.describe)('Knowledge Sources API', () => {
    let app;
    (0, vitest_1.beforeEach)(() => {
        app = (0, express_1.default)();
        app.use(express_1.default.json());
        app.use('/shops', knowledgeSources_1.default);
        app.use('/', knowledgeSources_1.default);
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)('GET /shops/:shopId/knowledge-sources', () => {
        (0, vitest_1.it)('should return all knowledge sources for a shop', async () => {
            const shopId = '1';
            const mockShop = { id: shopId, name: 'Test Shop' };
            const mockKnowledgeSources = [
                { id: '1', shopId, name: 'Source 1', type: 'text', source: 'Content 1' },
                { id: '2', shopId, name: 'Source 2', type: 'url', source: 'http://example.com' },
            ];
            repositories_1.shopRepository.findById.mockResolvedValue(mockShop);
            repositories_1.knowledgeSourceRepository.findByShopId.mockResolvedValue(mockKnowledgeSources);
            const response = await (0, supertest_1.default)(app)
                .get(`/shops/${shopId}/knowledge-sources`)
                .set('Authorization', 'Bearer test-api-key');
            (0, vitest_1.expect)(response.status).toBe(200);
            (0, vitest_1.expect)(response.body).toEqual(mockKnowledgeSources);
            (0, vitest_1.expect)(repositories_1.shopRepository.findById).toHaveBeenCalledWith(shopId);
            (0, vitest_1.expect)(repositories_1.knowledgeSourceRepository.findByShopId).toHaveBeenCalledWith(shopId);
        });
        (0, vitest_1.it)('should return 404 if shop is not found', async () => {
            const shopId = '1';
            repositories_1.shopRepository.findById.mockResolvedValue(null);
            const response = await (0, supertest_1.default)(app)
                .get(`/shops/${shopId}/knowledge-sources`)
                .set('Authorization', 'Bearer test-api-key');
            (0, vitest_1.expect)(response.status).toBe(404);
            (0, vitest_1.expect)(response.body).toEqual({ error: 'Shop not found' });
        });
    });
    (0, vitest_1.describe)('POST /shops/:shopId/knowledge-sources', () => {
        (0, vitest_1.it)('should create a new knowledge source', async () => {
            const shopId = '1';
            const mockShop = { id: shopId, name: 'Test Shop' };
            const newKnowledgeSource = {
                name: 'New Source',
                type: 'text',
                source: 'Sample content'
            };
            const createdKnowledgeSource = {
                id: '1',
                shopId,
                ...newKnowledgeSource,
                status: 'pending'
            };
            repositories_1.shopRepository.findById.mockResolvedValue(mockShop);
            repositories_1.knowledgeSourceRepository.create.mockResolvedValue(createdKnowledgeSource);
            const response = await (0, supertest_1.default)(app)
                .post(`/shops/${shopId}/knowledge-sources`)
                .set('Authorization', 'Bearer test-api-key')
                .send(newKnowledgeSource);
            (0, vitest_1.expect)(response.status).toBe(201);
            (0, vitest_1.expect)(response.body).toEqual(createdKnowledgeSource);
            (0, vitest_1.expect)(repositories_1.shopRepository.findById).toHaveBeenCalledWith(shopId);
            (0, vitest_1.expect)(repositories_1.knowledgeSourceRepository.create).toHaveBeenCalledWith({
                shopId,
                ...newKnowledgeSource,
                status: 'pending'
            });
        });
        (0, vitest_1.it)('should return 400 if required fields are missing', async () => {
            const shopId = '1';
            const mockShop = { id: shopId, name: 'Test Shop' };
            repositories_1.shopRepository.findById.mockResolvedValue(mockShop);
            const response = await (0, supertest_1.default)(app)
                .post(`/shops/${shopId}/knowledge-sources`)
                .set('Authorization', 'Bearer test-api-key')
                .send({ name: 'New Source' });
            (0, vitest_1.expect)(response.status).toBe(400);
            (0, vitest_1.expect)(response.body).toEqual({ error: 'Name, type, and source are required' });
        });
        (0, vitest_1.it)('should return 400 if type is invalid', async () => {
            const shopId = '1';
            const mockShop = { id: shopId, name: 'Test Shop' };
            repositories_1.shopRepository.findById.mockResolvedValue(mockShop);
            const response = await (0, supertest_1.default)(app)
                .post(`/shops/${shopId}/knowledge-sources`)
                .set('Authorization', 'Bearer test-api-key')
                .send({
                name: 'New Source',
                type: 'invalid-type',
                source: 'Sample content'
            });
            (0, vitest_1.expect)(response.status).toBe(400);
            (0, vitest_1.expect)(response.body).toEqual({ error: 'Type must be one of: text, url' });
        });
    });
    (0, vitest_1.describe)('PATCH /knowledge-sources/:id/status', () => {
        (0, vitest_1.it)('should update the status of a knowledge source', async () => {
            const id = '1';
            const mockKnowledgeSource = {
                id,
                shopId: '1',
                name: 'Source 1',
                type: 'text',
                source: 'Content 1'
            };
            const updatedKnowledgeSource = {
                ...mockKnowledgeSource,
                status: 'ready'
            };
            repositories_1.knowledgeSourceRepository.findById.mockResolvedValue(mockKnowledgeSource);
            repositories_1.knowledgeSourceRepository.updateStatus.mockResolvedValue(updatedKnowledgeSource);
            const response = await (0, supertest_1.default)(app)
                .patch(`/knowledge-sources/${id}/status`)
                .set('Authorization', 'Bearer test-api-key')
                .send({ status: 'ready' });
            (0, vitest_1.expect)(response.status).toBe(200);
            (0, vitest_1.expect)(response.body).toEqual(updatedKnowledgeSource);
            (0, vitest_1.expect)(repositories_1.knowledgeSourceRepository.findById).toHaveBeenCalledWith(id);
            (0, vitest_1.expect)(repositories_1.knowledgeSourceRepository.updateStatus).toHaveBeenCalledWith(id, 'ready');
        });
        (0, vitest_1.it)('should return 400 if status is invalid', async () => {
            const id = '1';
            const mockKnowledgeSource = {
                id,
                shopId: '1',
                name: 'Source 1',
                type: 'text',
                source: 'Content 1'
            };
            repositories_1.knowledgeSourceRepository.findById.mockResolvedValue(mockKnowledgeSource);
            const response = await (0, supertest_1.default)(app)
                .patch(`/knowledge-sources/${id}/status`)
                .set('Authorization', 'Bearer test-api-key')
                .send({ status: 'invalid-status' });
            (0, vitest_1.expect)(response.status).toBe(400);
            (0, vitest_1.expect)(response.body).toEqual({ error: 'Status must be one of: pending, processing, ready, error' });
        });
    });
});
//# sourceMappingURL=knowledgeSources.test.js.map