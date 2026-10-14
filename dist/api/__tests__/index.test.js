"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const express_1 = __importDefault(require("express"));
const supertest_1 = __importDefault(require("supertest"));
vitest_1.vi.mock('../../db/postgres/repositories', () => ({
    businessOwnerRepository: {},
    shopRepository: {},
    settingRepository: {},
    knowledgeSourceRepository: {}
}));
vitest_1.vi.mock('../middleware', () => ({
    authenticate: (req, res, next) => next()
}));
const index_1 = __importDefault(require("../index"));
(0, vitest_1.describe)('API Router', () => {
    let app;
    (0, vitest_1.beforeEach)(() => {
        app = (0, express_1.default)();
        app.use(express_1.default.json());
        app.use('/api', index_1.default);
    });
    (0, vitest_1.it)('should mount all API routes', async () => {
        const businessOwnersResponse = await (0, supertest_1.default)(app)
            .get('/api/business-owners')
            .set('Authorization', 'Bearer invalid-key');
        (0, vitest_1.expect)([500, 401]).toContain(businessOwnersResponse.status);
        const shopsResponse = await (0, supertest_1.default)(app)
            .get('/api/shops')
            .set('Authorization', 'Bearer invalid-key');
        (0, vitest_1.expect)([500, 401]).toContain(shopsResponse.status);
    });
});
//# sourceMappingURL=index.test.js.map