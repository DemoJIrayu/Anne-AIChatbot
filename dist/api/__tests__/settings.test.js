"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const express_1 = __importDefault(require("express"));
const supertest_1 = __importDefault(require("supertest"));
const settings_1 = __importDefault(require("../settings"));
const repositories_1 = require("../../db/postgres/repositories");
vitest_1.vi.mock('../../db/postgres/repositories', () => ({
    settingRepository: {
        findByShopId: vitest_1.vi.fn(),
        updateByShopId: vitest_1.vi.fn(),
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
(0, vitest_1.describe)('Settings API', () => {
    let app;
    (0, vitest_1.beforeEach)(() => {
        app = (0, express_1.default)();
        app.use(express_1.default.json());
        app.use('/shops', settings_1.default);
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)('GET /shops/:shopId/settings', () => {
        (0, vitest_1.it)('should return settings for a shop', async () => {
            const shopId = '1';
            const mockShop = { id: shopId, name: 'Test Shop' };
            const mockSettings = {
                id: '1',
                shopId,
                autoReply: true,
                welcomeMessage: 'Welcome!'
            };
            repositories_1.shopRepository.findById.mockResolvedValue(mockShop);
            repositories_1.settingRepository.findByShopId.mockResolvedValue(mockSettings);
            const response = await (0, supertest_1.default)(app)
                .get(`/shops/${shopId}/settings`)
                .set('Authorization', 'Bearer test-api-key');
            (0, vitest_1.expect)(response.status).toBe(200);
            (0, vitest_1.expect)(response.body).toEqual(mockSettings);
            (0, vitest_1.expect)(repositories_1.shopRepository.findById).toHaveBeenCalledWith(shopId);
            (0, vitest_1.expect)(repositories_1.settingRepository.findByShopId).toHaveBeenCalledWith(shopId);
        });
        (0, vitest_1.it)('should return 404 if shop is not found', async () => {
            const shopId = '1';
            repositories_1.shopRepository.findById.mockResolvedValue(null);
            const response = await (0, supertest_1.default)(app)
                .get(`/shops/${shopId}/settings`)
                .set('Authorization', 'Bearer test-api-key');
            (0, vitest_1.expect)(response.status).toBe(404);
            (0, vitest_1.expect)(response.body).toEqual({ error: 'Shop not found' });
        });
    });
    (0, vitest_1.describe)('PUT /shops/:shopId/settings', () => {
        (0, vitest_1.it)('should update settings for a shop', async () => {
            const shopId = '1';
            const mockShop = { id: shopId, name: 'Test Shop' };
            const updatedSettings = {
                autoReply: false,
                welcomeMessage: 'New welcome message',
                confidenceThreshold: 0.8
            };
            const mockSettings = {
                id: '1',
                shopId,
                ...updatedSettings
            };
            repositories_1.shopRepository.findById.mockResolvedValue(mockShop);
            repositories_1.settingRepository.updateByShopId.mockResolvedValue(mockSettings);
            const response = await (0, supertest_1.default)(app)
                .put(`/shops/${shopId}/settings`)
                .set('Authorization', 'Bearer test-api-key')
                .send(updatedSettings);
            (0, vitest_1.expect)(response.status).toBe(200);
            (0, vitest_1.expect)(response.body).toEqual(mockSettings);
            (0, vitest_1.expect)(repositories_1.shopRepository.findById).toHaveBeenCalledWith(shopId);
            (0, vitest_1.expect)(repositories_1.settingRepository.updateByShopId).toHaveBeenCalledWith(shopId, updatedSettings);
        });
        (0, vitest_1.it)('should return 400 if confidence threshold is invalid', async () => {
            const shopId = '1';
            const mockShop = { id: shopId, name: 'Test Shop' };
            repositories_1.shopRepository.findById.mockResolvedValue(mockShop);
            const response = await (0, supertest_1.default)(app)
                .put(`/shops/${shopId}/settings`)
                .set('Authorization', 'Bearer test-api-key')
                .send({ confidenceThreshold: 1.5 });
            (0, vitest_1.expect)(response.status).toBe(400);
            (0, vitest_1.expect)(response.body).toEqual({ error: 'Confidence threshold must be between 0 and 1' });
        });
    });
    (0, vitest_1.describe)('PATCH /shops/:shopId/settings/auto-reply', () => {
        (0, vitest_1.it)('should toggle auto-reply for a shop', async () => {
            const shopId = '1';
            const mockShop = { id: shopId, name: 'Test Shop' };
            const mockSettings = {
                id: '1',
                shopId,
                autoReply: true
            };
            repositories_1.shopRepository.findById.mockResolvedValue(mockShop);
            repositories_1.settingRepository.updateByShopId.mockResolvedValue(mockSettings);
            const response = await (0, supertest_1.default)(app)
                .patch(`/shops/${shopId}/settings/auto-reply`)
                .set('Authorization', 'Bearer test-api-key')
                .send({ enabled: false });
            (0, vitest_1.expect)(response.status).toBe(200);
            (0, vitest_1.expect)(response.body).toEqual(mockSettings);
            (0, vitest_1.expect)(repositories_1.shopRepository.findById).toHaveBeenCalledWith(shopId);
            (0, vitest_1.expect)(repositories_1.settingRepository.updateByShopId).toHaveBeenCalledWith(shopId, { autoReply: false });
        });
        (0, vitest_1.it)('should return 400 if enabled is not a boolean', async () => {
            const shopId = '1';
            const mockShop = { id: shopId, name: 'Test Shop' };
            repositories_1.shopRepository.findById.mockResolvedValue(mockShop);
            const response = await (0, supertest_1.default)(app)
                .patch(`/shops/${shopId}/settings/auto-reply`)
                .set('Authorization', 'Bearer test-api-key')
                .send({ enabled: 'not-a-boolean' });
            (0, vitest_1.expect)(response.status).toBe(400);
            (0, vitest_1.expect)(response.body).toEqual({ error: 'Enabled must be a boolean value' });
        });
    });
});
//# sourceMappingURL=settings.test.js.map