"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const ioredis_1 = __importDefault(require("ioredis"));
const repositories_1 = require("../redis/repositories");
vitest_1.vi.mock('ioredis', () => {
    return {
        default: vitest_1.vi.fn(() => ({
            set: vitest_1.vi.fn(),
            setex: vitest_1.vi.fn(),
            get: vitest_1.vi.fn(),
            del: vitest_1.vi.fn(),
            exists: vitest_1.vi.fn(),
            expire: vitest_1.vi.fn(),
            flushall: vitest_1.vi.fn(),
            quit: vitest_1.vi.fn(),
            eval: vitest_1.vi.fn(),
            status: 'ready',
            on: vitest_1.vi.fn(),
            connect: vitest_1.vi.fn(),
        })),
    };
});
(0, vitest_1.describe)('Redis Repositories', () => {
    let cacheRepo;
    let lockRepo;
    let mockRedis;
    (0, vitest_1.beforeEach)(() => {
        process.env.NODE_ENV = 'test';
        mockRedis = new ioredis_1.default();
        cacheRepo = new repositories_1.CacheRepository();
        lockRepo = new repositories_1.LockRepository();
        cacheRepo.redis = mockRedis;
        lockRepo.redis = mockRedis;
    });
    (0, vitest_1.afterEach)(() => {
        vitest_1.vi.clearAllMocks();
        delete process.env.NODE_ENV;
    });
    (0, vitest_1.describe)('CacheRepository', () => {
        (0, vitest_1.it)('should set a cache value', async () => {
            mockRedis.set.mockResolvedValue('OK');
            await cacheRepo.set('test-key', 'test-value');
            (0, vitest_1.expect)(mockRedis.set).toHaveBeenCalledWith('test-key', 'test-value');
        });
        (0, vitest_1.it)('should set a cache value with expiration', async () => {
            mockRedis.setex.mockResolvedValue('OK');
            await cacheRepo.set('test-key', 'test-value', 300);
            (0, vitest_1.expect)(mockRedis.setex).toHaveBeenCalledWith('test-key', 300, 'test-value');
        });
        (0, vitest_1.it)('should get a cache value', async () => {
            mockRedis.get.mockResolvedValue('test-value');
            const result = await cacheRepo.get('test-key');
            (0, vitest_1.expect)(result).toBe('test-value');
            (0, vitest_1.expect)(mockRedis.get).toHaveBeenCalledWith('test-key');
        });
        (0, vitest_1.it)('should delete a cache key', async () => {
            mockRedis.del.mockResolvedValue(1);
            const result = await cacheRepo.delete('test-key');
            (0, vitest_1.expect)(result).toBe(1);
            (0, vitest_1.expect)(mockRedis.del).toHaveBeenCalledWith('test-key');
        });
        (0, vitest_1.it)('should check if key exists', async () => {
            mockRedis.exists.mockResolvedValue(1);
            const result = await cacheRepo.exists('test-key');
            (0, vitest_1.expect)(result).toBe(true);
            (0, vitest_1.expect)(mockRedis.exists).toHaveBeenCalledWith('test-key');
        });
    });
    (0, vitest_1.describe)('LockRepository', () => {
        (0, vitest_1.it)('should acquire a lock', async () => {
            mockRedis.set.mockResolvedValue('OK');
            const result = await lockRepo.acquireLock('lock-key', 'lock-value', 30);
            (0, vitest_1.expect)(result).toBe(true);
            (0, vitest_1.expect)(mockRedis.set).toHaveBeenCalledWith('lock-key', 'lock-value', 'EX', 30, 'NX');
        });
        (0, vitest_1.it)('should release a lock', async () => {
            mockRedis.eval.mockResolvedValue(1);
            const result = await lockRepo.releaseLock('lock-key', 'lock-value');
            (0, vitest_1.expect)(result).toBe(true);
            (0, vitest_1.expect)(mockRedis.eval).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should check if lock is active', async () => {
            mockRedis.exists.mockResolvedValue(1);
            const result = await lockRepo.isLocked('lock-key');
            (0, vitest_1.expect)(result).toBe(true);
            (0, vitest_1.expect)(mockRedis.exists).toHaveBeenCalledWith('lock-key');
        });
    });
});
//# sourceMappingURL=redis-repositories.test.js.map