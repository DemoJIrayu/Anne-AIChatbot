"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const repositories_1 = require("../postgres/repositories");
vitest_1.vi.mock('@prisma/client', () => {
    const mockPrisma = {
        businessOwner: {
            create: vitest_1.vi.fn(),
            findUnique: vitest_1.vi.fn(),
            findMany: vitest_1.vi.fn(),
            update: vitest_1.vi.fn(),
            delete: vitest_1.vi.fn(),
        },
        shop: {
            create: vitest_1.vi.fn(),
            findUnique: vitest_1.vi.fn(),
            findMany: vitest_1.vi.fn(),
            update: vitest_1.vi.fn(),
            delete: vitest_1.vi.fn(),
        },
        setting: {
            create: vitest_1.vi.fn(),
            findUnique: vitest_1.vi.fn(),
            upsert: vitest_1.vi.fn(),
            delete: vitest_1.vi.fn(),
        },
        knowledgeSource: {
            create: vitest_1.vi.fn(),
            findUnique: vitest_1.vi.fn(),
            findMany: vitest_1.vi.fn(),
            update: vitest_1.vi.fn(),
            delete: vitest_1.vi.fn(),
        },
        $transaction: vitest_1.vi.fn(),
    };
    return {
        PrismaClient: vitest_1.vi.fn(() => mockPrisma),
    };
});
(0, vitest_1.describe)('PostgreSQL Repositories', () => {
    let businessOwnerRepo;
    let shopRepo;
    let settingRepo;
    let knowledgeSourceRepo;
    (0, vitest_1.beforeEach)(() => {
        businessOwnerRepo = new repositories_1.BusinessOwnerRepository();
        shopRepo = new repositories_1.ShopRepository();
        settingRepo = new repositories_1.SettingRepository();
        knowledgeSourceRepo = new repositories_1.KnowledgeSourceRepository();
    });
    (0, vitest_1.afterEach)(() => {
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)('BusinessOwnerRepository', () => {
        (0, vitest_1.it)('should create a business owner', async () => {
            const mockData = { name: 'Test Owner', email: 'test@example.com' };
            const mockResult = { id: '1', ...mockData, createdAt: new Date(), updatedAt: new Date() };
            businessOwnerRepo.prisma.businessOwner.create.mockResolvedValue(mockResult);
            const result = await businessOwnerRepo.create(mockData);
            (0, vitest_1.expect)(result).toEqual(mockResult);
            (0, vitest_1.expect)(businessOwnerRepo.prisma.businessOwner.create).toHaveBeenCalledWith({ data: mockData });
        });
        (0, vitest_1.it)('should find business owner by id', async () => {
            const mockResult = { id: '1', name: 'Test Owner', email: 'test@example.com' };
            businessOwnerRepo.prisma.businessOwner.findUnique.mockResolvedValue(mockResult);
            const result = await businessOwnerRepo.findById('1');
            (0, vitest_1.expect)(result).toEqual(mockResult);
            (0, vitest_1.expect)(businessOwnerRepo.prisma.businessOwner.findUnique).toHaveBeenCalledWith({
                where: { id: '1' },
                include: { shops: true },
            });
        });
    });
    (0, vitest_1.describe)('ShopRepository', () => {
        (0, vitest_1.it)('should create a shop', async () => {
            const mockData = { name: 'Test Shop', businessOwnerId: '1' };
            const mockResult = { id: '1', ...mockData, createdAt: new Date(), updatedAt: new Date() };
            shopRepo.prisma.shop.create.mockResolvedValue(mockResult);
            const result = await shopRepo.create(mockData);
            (0, vitest_1.expect)(result).toEqual(mockResult);
            (0, vitest_1.expect)(shopRepo.prisma.shop.create).toHaveBeenCalledWith({ data: mockData });
        });
    });
    (0, vitest_1.describe)('SettingRepository', () => {
        (0, vitest_1.it)('should create a setting', async () => {
            const mockData = { shopId: '1', autoReply: true };
            const mockResult = { id: '1', ...mockData, welcomeMessage: null, createdAt: new Date(), updatedAt: new Date() };
            settingRepo.prisma.setting.create.mockResolvedValue(mockResult);
            const result = await settingRepo.create(mockData);
            (0, vitest_1.expect)(result).toEqual(mockResult);
            (0, vitest_1.expect)(settingRepo.prisma.setting.create).toHaveBeenCalledWith({ data: mockData });
        });
    });
    (0, vitest_1.describe)('KnowledgeSourceRepository', () => {
        (0, vitest_1.it)('should create a knowledge source', async () => {
            const mockData = { shopId: '1', name: 'Test Source', type: 'pdf', source: '/path/to/file.pdf' };
            const mockResult = { id: '1', ...mockData, status: 'pending', createdAt: new Date(), updatedAt: new Date() };
            knowledgeSourceRepo.prisma.knowledgeSource.create.mockResolvedValue(mockResult);
            const result = await knowledgeSourceRepo.create(mockData);
            (0, vitest_1.expect)(result).toEqual(mockResult);
            (0, vitest_1.expect)(knowledgeSourceRepo.prisma.knowledgeSource.create).toHaveBeenCalledWith({ data: mockData });
        });
    });
});
//# sourceMappingURL=postgres-repositories.test.js.map