"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const express_1 = __importDefault(require("express"));
const supertest_1 = __importDefault(require("supertest"));
const businessOwners_1 = __importDefault(require("../businessOwners"));
const repositories_1 = require("../../db/postgres/repositories");
vitest_1.vi.mock('../../db/postgres/repositories', () => ({
    businessOwnerRepository: {
        findAll: vitest_1.vi.fn(),
        findById: vitest_1.vi.fn(),
        create: vitest_1.vi.fn(),
        update: vitest_1.vi.fn(),
        delete: vitest_1.vi.fn(),
        findByEmail: vitest_1.vi.fn(),
    },
    shopRepository: {
        findByBusinessOwnerId: vitest_1.vi.fn(),
    }
}));
vitest_1.vi.mock('../../utils/logger', () => ({
    default: {
        info: vitest_1.vi.fn(),
        warn: vitest_1.vi.fn(),
        error: vitest_1.vi.fn(),
    }
}));
(0, vitest_1.describe)('Business Owners API', () => {
    let app;
    (0, vitest_1.beforeEach)(() => {
        app = (0, express_1.default)();
        app.use(express_1.default.json());
        app.use('/business-owners', businessOwners_1.default);
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)('GET /business-owners', () => {
        (0, vitest_1.it)('should return all business owners', async () => {
            const mockOwners = [
                { id: '1', name: 'John Doe', email: 'john@example.com' },
                { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
            ];
            repositories_1.businessOwnerRepository.findAll.mockResolvedValue(mockOwners);
            const response = await (0, supertest_1.default)(app)
                .get('/business-owners')
                .set('Authorization', 'Bearer test-api-key');
            (0, vitest_1.expect)(response.status).toBe(200);
            (0, vitest_1.expect)(response.body).toEqual(mockOwners);
            (0, vitest_1.expect)(repositories_1.businessOwnerRepository.findAll).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should return 500 if there is an error', async () => {
            repositories_1.businessOwnerRepository.findAll.mockRejectedValue(new Error('Database error'));
            const response = await (0, supertest_1.default)(app)
                .get('/business-owners')
                .set('Authorization', 'Bearer test-api-key');
            (0, vitest_1.expect)(response.status).toBe(500);
            (0, vitest_1.expect)(response.body).toEqual({ error: 'Failed to fetch business owners' });
        });
    });
    (0, vitest_1.describe)('POST /business-owners', () => {
        (0, vitest_1.it)('should create a new business owner', async () => {
            const newOwner = { name: 'John Doe', email: 'john@example.com' };
            const createdOwner = { id: '1', ...newOwner };
            repositories_1.businessOwnerRepository.findByEmail.mockResolvedValue(null);
            repositories_1.businessOwnerRepository.create.mockResolvedValue(createdOwner);
            const response = await (0, supertest_1.default)(app)
                .post('/business-owners')
                .set('Authorization', 'Bearer test-api-key')
                .send(newOwner);
            (0, vitest_1.expect)(response.status).toBe(201);
            (0, vitest_1.expect)(response.body).toEqual(createdOwner);
            (0, vitest_1.expect)(repositories_1.businessOwnerRepository.findByEmail).toHaveBeenCalledWith('john@example.com');
            (0, vitest_1.expect)(repositories_1.businessOwnerRepository.create).toHaveBeenCalledWith(newOwner);
        });
        (0, vitest_1.it)('should return 400 if name or email is missing', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/business-owners')
                .set('Authorization', 'Bearer test-api-key')
                .send({ name: 'John Doe' });
            (0, vitest_1.expect)(response.status).toBe(400);
            (0, vitest_1.expect)(response.body).toEqual({ error: 'Name and email are required' });
        });
        (0, vitest_1.it)('should return 409 if business owner with email already exists', async () => {
            const newOwner = { name: 'John Doe', email: 'john@example.com' };
            const existingOwner = { id: '1', ...newOwner };
            repositories_1.businessOwnerRepository.findByEmail.mockResolvedValue(existingOwner);
            const response = await (0, supertest_1.default)(app)
                .post('/business-owners')
                .set('Authorization', 'Bearer test-api-key')
                .send(newOwner);
            (0, vitest_1.expect)(response.status).toBe(409);
            (0, vitest_1.expect)(response.body).toEqual({ error: 'Business owner with this email already exists' });
        });
    });
    (0, vitest_1.describe)('Authentication', () => {
        (0, vitest_1.it)('should return 401 if no authorization header is provided', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/business-owners');
            (0, vitest_1.expect)(response.status).toBe(401);
            (0, vitest_1.expect)(response.body).toEqual({ error: 'Missing Authorization header' });
        });
        (0, vitest_1.it)('should return 401 if invalid authorization header format is provided', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/business-owners')
                .set('Authorization', 'InvalidFormat');
            (0, vitest_1.expect)(response.status).toBe(401);
            (0, vitest_1.expect)(response.body).toEqual({ error: 'Invalid Authorization header format' });
        });
    });
});
//# sourceMappingURL=businessOwners.test.js.map