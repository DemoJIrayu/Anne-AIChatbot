"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const express_1 = __importDefault(require("express"));
const supertest_1 = __importDefault(require("supertest"));
const shops_1 = __importDefault(require("../shops"));
const repositories_1 = require("../../db/postgres/repositories");
vitest_1.vi.mock('../../db/postgres/repositories', () => ({
    shopRepository: {
        findAll: vitest_1.vi.fn(),
        findById: vitest_1.vi.fn(),
        create: vitest_1.vi.fn(),
        update: vitest_1.vi.fn(),
        delete: vitest_1.vi.fn(),
        findByBusinessOwnerId: vitest_1.vi.fn(),
    },
    BusinessOwnerRepository: vitest_1.vi.fn().mockImplementation(() => ({
        findById: vitest_1.vi.fn(),
    })),
    settingRepository: {
        findByShopId: vitest_1.vi.fn(),
    },
    knowledgeSourceRepository: {
        findByShopId: vitest_1.vi.fn(),
    }
}));
vitest_1.vi.mock('../../utils/logger', () => ({
    default: {
        info: vitest_1.vi.fn(),
        warn: vitest_1.vi.fn(),
        error: vitest_1.vi.fn(),
    }
}));
(0, vitest_1.describe)('Shops API', () => {
    let app;
    (0, vitest_1.beforeEach)(() => {
        app = (0, express_1.default)();
        app.use(express_1.default.json());
        app.use('/shops', shops_1.default);
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)('GET /shops', () => {
        (0, vitest_1.it)('should return all shops', async () => {
            const mockShops = [
                { id: '1', name: 'Shop 1', businessOwnerId: '1' },
                { id: '2', name: 'Shop 2', businessOwnerId: '2' },
            ];
            repositories_1.shopRepository.findAll.mockResolvedValue(mockShops);
            const response = await (0, supertest_1.default)(app)
                .get('/shops')
                .set('Authorization', 'Bearer test-api-key');
            (0, vitest_1.expect)(response.status).toBe(200);
            (0, vitest_1.expect)(response.body).toEqual(mockShops);
            (0, vitest_1.expect)(repositories_1.shopRepository.findAll).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should return 500 if there is an error', async () => {
            repositories_1.shopRepository.findAll.mockRejectedValue(new Error('Database error'));
            const response = await (0, supertest_1.default)(app)
                .get('/shops')
                .set('Authorization', 'Bearer test-api-key');
            (0, vitest_1.expect)(response.status).toBe(500);
            (0, vitest_1.expect)(response.body).toEqual({ error: 'Failed to fetch shops' });
        });
    });
    (0, vitest_1.describe)('POST /shops', () => {
        (0, vitest_1.it)('should create a new shop', async () => {
            const newShop = { name: 'New Shop', businessOwnerId: '1' };
            const createdShop = { id: '1', ...newShop };
            const mockBusinessOwner = { id: '1', name: 'John Doe', email: 'john@example.com' };
            const mockBusinessOwnerRepo = {
                findById: vitest_1.vi.fn().mockResolvedValue(mockBusinessOwner)
            };
            repositories_1.BusinessOwnerRepository.mockImplementation(() => mockBusinessOwnerRepo);
            repositories_1.shopRepository.create.mockResolvedValue(createdShop);
            const response = await (0, supertest_1.default)(app)
                .post('/shops')
                .set('Authorization', 'Bearer test-api-key')
                .send(newShop);
            (0, vitest_1.expect)(response.status).toBe(201);
            (0, vitest_1.expect)(response.body).toEqual(createdShop);
            (0, vitest_1.expect)(mockBusinessOwnerRepo.findById).toHaveBeenCalledWith('1');
            (0, vitest_1.expect)(repositories_1.shopRepository.create).toHaveBeenCalledWith(newShop);
        });
        (0, vitest_1.it)('should return 400 if name or businessOwnerId is missing', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/shops')
                .set('Authorization', 'Bearer test-api-key')
                .send({ name: 'New Shop' });
            (0, vitest_1.expect)(response.status).toBe(400);
            (0, vitest_1.expect)(response.body).toEqual({ error: 'Name and businessOwnerId are required' });
        });
        (0, vitest_1.it)('should return 400 if business owner is not found', async () => {
            const newShop = { name: 'New Shop', businessOwnerId: '1' };
            const mockBusinessOwnerRepo = {
                findById: vitest_1.vi.fn().mockResolvedValue(null)
            };
            repositories_1.BusinessOwnerRepository.mockImplementation(() => mockBusinessOwnerRepo);
            const response = await (0, supertest_1.default)(app)
                .post('/shops')
                .set('Authorization', 'Bearer test-api-key')
                .send(newShop);
            (0, vitest_1.expect)(response.status).toBe(400);
            (0, vitest_1.expect)(response.body).toEqual({ error: 'Business owner not found' });
        });
    });
});
//# sourceMappingURL=shops.test.js.map