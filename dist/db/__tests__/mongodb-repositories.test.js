"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const repositories_1 = require("../mongodb/repositories");
const mockLineMessage = {
    messageId: 'test-line-1',
    userId: 'user-1',
    shopId: 'shop-1',
    timestamp: new Date(),
    type: 'text',
    text: 'Hello',
    _id: '1',
    createdAt: new Date(),
    updatedAt: new Date(),
    save: vitest_1.vi.fn(),
};
const mockFacebookMessage = {
    messageId: 'test-fb-1',
    userId: 'user-1',
    shopId: 'shop-1',
    timestamp: new Date(),
    type: 'text',
    text: 'Hello',
    _id: '1',
    createdAt: new Date(),
    updatedAt: new Date(),
    save: vitest_1.vi.fn(),
};
const mockExecFn = vitest_1.vi.fn();
const mockFindOneReturn = {
    exec: mockExecFn,
};
const mockFindReturn = {
    sort: vitest_1.vi.fn().mockReturnThis(),
    limit: vitest_1.vi.fn().mockReturnThis(),
    exec: mockExecFn,
};
vitest_1.vi.mock('../mongodb/models', () => {
    const LineMessageMock = vitest_1.vi.fn(() => ({
        save: vitest_1.vi.fn().mockResolvedValue(mockLineMessage),
    }));
    const FacebookMessageMock = vitest_1.vi.fn(() => ({
        save: vitest_1.vi.fn().mockResolvedValue(mockFacebookMessage),
    }));
    Object.defineProperty(LineMessageMock, 'findOne', {
        value: vitest_1.vi.fn(() => mockFindOneReturn),
        writable: false
    });
    Object.defineProperty(LineMessageMock, 'find', {
        value: vitest_1.vi.fn(() => mockFindReturn),
        writable: false
    });
    Object.defineProperty(LineMessageMock, 'findOneAndUpdate', {
        value: vitest_1.vi.fn(() => mockFindOneReturn),
        writable: false
    });
    Object.defineProperty(LineMessageMock, 'findOneAndDelete', {
        value: vitest_1.vi.fn(() => mockFindOneReturn),
        writable: false
    });
    Object.defineProperty(FacebookMessageMock, 'findOne', {
        value: vitest_1.vi.fn(() => mockFindOneReturn),
        writable: false
    });
    Object.defineProperty(FacebookMessageMock, 'find', {
        value: vitest_1.vi.fn(() => mockFindReturn),
        writable: false
    });
    Object.defineProperty(FacebookMessageMock, 'findOneAndUpdate', {
        value: vitest_1.vi.fn(() => mockFindOneReturn),
        writable: false
    });
    Object.defineProperty(FacebookMessageMock, 'findOneAndDelete', {
        value: vitest_1.vi.fn(() => mockFindOneReturn),
        writable: false
    });
    return {
        LineMessage: LineMessageMock,
        FacebookMessage: FacebookMessageMock,
        __esModule: true,
    };
});
(0, vitest_1.describe)('MongoDB Repositories', () => {
    let lineMessageRepo;
    let facebookMessageRepo;
    (0, vitest_1.beforeEach)(() => {
        lineMessageRepo = new repositories_1.LineMessageRepository();
        facebookMessageRepo = new repositories_1.FacebookMessageRepository();
        mockExecFn.mockReset();
    });
    (0, vitest_1.describe)('LineMessageRepository', () => {
        (0, vitest_1.it)('should create a LINE message', async () => {
            const mockData = {
                messageId: 'test-line-1',
                userId: 'user-1',
                shopId: 'shop-1',
                timestamp: new Date(),
                type: 'text',
                text: 'Hello'
            };
            mockExecFn.mockResolvedValueOnce(mockLineMessage);
            const result = await lineMessageRepo.create(mockData);
            (0, vitest_1.expect)(result).toEqual(mockLineMessage);
        });
        (0, vitest_1.it)('should find LINE message by id', async () => {
            mockExecFn.mockResolvedValueOnce(mockLineMessage);
            const result = await lineMessageRepo.findById('test-line-1');
            (0, vitest_1.expect)(result).toEqual(mockLineMessage);
        });
        (0, vitest_1.it)('should find LINE messages by user id', async () => {
            mockExecFn.mockResolvedValueOnce([mockLineMessage]);
            const result = await lineMessageRepo.findByUserId('user-1', 5);
            (0, vitest_1.expect)(result).toEqual([mockLineMessage]);
        });
        (0, vitest_1.it)('should find LINE messages by shop id', async () => {
            mockExecFn.mockResolvedValueOnce([mockLineMessage]);
            const result = await lineMessageRepo.findByShopId('shop-1', 5);
            (0, vitest_1.expect)(result).toEqual([mockLineMessage]);
        });
        (0, vitest_1.it)('should update reply for LINE message', async () => {
            mockExecFn.mockResolvedValueOnce(mockLineMessage);
            const result = await lineMessageRepo.updateReply('test-line-1', 'reply text');
            (0, vitest_1.expect)(result).toEqual(mockLineMessage);
        });
        (0, vitest_1.it)('should delete LINE message by id', async () => {
            mockExecFn.mockResolvedValueOnce(mockLineMessage);
            const result = await lineMessageRepo.deleteById('test-line-1');
            (0, vitest_1.expect)(result).toEqual(mockLineMessage);
        });
    });
    (0, vitest_1.describe)('FacebookMessageRepository', () => {
        (0, vitest_1.it)('should create a Facebook message', async () => {
            const mockData = {
                messageId: 'test-fb-1',
                userId: 'user-1',
                shopId: 'shop-1',
                timestamp: new Date(),
                type: 'text',
                text: 'Hello'
            };
            mockExecFn.mockResolvedValueOnce(mockFacebookMessage);
            const result = await facebookMessageRepo.create(mockData);
            (0, vitest_1.expect)(result).toEqual(mockFacebookMessage);
        });
        (0, vitest_1.it)('should find Facebook message by id', async () => {
            mockExecFn.mockResolvedValueOnce(mockFacebookMessage);
            const result = await facebookMessageRepo.findById('test-fb-1');
            (0, vitest_1.expect)(result).toEqual(mockFacebookMessage);
        });
        (0, vitest_1.it)('should find Facebook messages by user id', async () => {
            mockExecFn.mockResolvedValueOnce([mockFacebookMessage]);
            const result = await facebookMessageRepo.findByUserId('user-1', 5);
            (0, vitest_1.expect)(result).toEqual([mockFacebookMessage]);
        });
        (0, vitest_1.it)('should find Facebook messages by shop id', async () => {
            mockExecFn.mockResolvedValueOnce([mockFacebookMessage]);
            const result = await facebookMessageRepo.findByShopId('shop-1', 5);
            (0, vitest_1.expect)(result).toEqual([mockFacebookMessage]);
        });
        (0, vitest_1.it)('should update reply for Facebook message', async () => {
            mockExecFn.mockResolvedValueOnce(mockFacebookMessage);
            const result = await facebookMessageRepo.updateReply('test-fb-1', 'reply text');
            (0, vitest_1.expect)(result).toEqual(mockFacebookMessage);
        });
        (0, vitest_1.it)('should delete Facebook message by id', async () => {
            mockExecFn.mockResolvedValueOnce(mockFacebookMessage);
            const result = await facebookMessageRepo.deleteById('test-fb-1');
            (0, vitest_1.expect)(result).toEqual(mockFacebookMessage);
        });
    });
});
//# sourceMappingURL=mongodb-repositories.test.js.map