import { describe, it, beforeEach, afterEach, vi, expect } from 'vitest';
import Redis from 'ioredis';
import {
  CacheRepository,
  LockRepository
} from '../redis/repositories';

// Mock Redis
vi.mock('ioredis', () => {
  return {
    default: vi.fn(() => ({
      set: vi.fn(),
      setex: vi.fn(),
      get: vi.fn(),
      del: vi.fn(),
      exists: vi.fn(),
      expire: vi.fn(),
      flushall: vi.fn(),
      quit: vi.fn(),
      eval: vi.fn(),
      status: 'ready',
      on: vi.fn(),
      connect: vi.fn(),
    })),
  };
});

describe('Redis Repositories', () => {
  let cacheRepo: CacheRepository;
  let lockRepo: LockRepository;
  let mockRedis: any;

  beforeEach(() => {
    // Set NODE_ENV to test to avoid connection issues
    process.env.NODE_ENV = 'test';
    
    mockRedis = new (Redis as any)();
    cacheRepo = new CacheRepository();
    lockRepo = new LockRepository();
    
    // Replace the Redis client with our mock
    (cacheRepo as any).redis = mockRedis;
    (lockRepo as any).redis = mockRedis;
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete process.env.NODE_ENV;
  });

  describe('CacheRepository', () => {
    it('should set a cache value', async () => {
      mockRedis.set.mockResolvedValue('OK');
      
      await cacheRepo.set('test-key', 'test-value');
      
      expect(mockRedis.set).toHaveBeenCalledWith('test-key', 'test-value');
    });

    it('should set a cache value with expiration', async () => {
      mockRedis.setex.mockResolvedValue('OK');
      
      await cacheRepo.set('test-key', 'test-value', 300);
      
      expect(mockRedis.setex).toHaveBeenCalledWith('test-key', 300, 'test-value');
    });

    it('should get a cache value', async () => {
      mockRedis.get.mockResolvedValue('test-value');
      
      const result = await cacheRepo.get('test-key');
      
      expect(result).toBe('test-value');
      expect(mockRedis.get).toHaveBeenCalledWith('test-key');
    });

    it('should delete a cache key', async () => {
      mockRedis.del.mockResolvedValue(1);
      
      const result = await cacheRepo.delete('test-key');
      
      expect(result).toBe(1);
      expect(mockRedis.del).toHaveBeenCalledWith('test-key');
    });

    it('should check if key exists', async () => {
      mockRedis.exists.mockResolvedValue(1);
      
      const result = await cacheRepo.exists('test-key');
      
      expect(result).toBe(true);
      expect(mockRedis.exists).toHaveBeenCalledWith('test-key');
    });
  });

  describe('LockRepository', () => {
    it('should acquire a lock', async () => {
      mockRedis.set.mockResolvedValue('OK');
      
      const result = await lockRepo.acquireLock('lock-key', 'lock-value', 30);
      
      expect(result).toBe(true);
      expect(mockRedis.set).toHaveBeenCalledWith('lock-key', 'lock-value', 'EX', 30, 'NX');
    });

    it('should release a lock', async () => {
      mockRedis.eval.mockResolvedValue(1);
      
      const result = await lockRepo.releaseLock('lock-key', 'lock-value');
      
      expect(result).toBe(true);
      expect(mockRedis.eval).toHaveBeenCalled();
    });

    it('should check if lock is active', async () => {
      mockRedis.exists.mockResolvedValue(1);
      
      const result = await lockRepo.isLocked('lock-key');
      
      expect(result).toBe(true);
      expect(mockRedis.exists).toHaveBeenCalledWith('lock-key');
    });
  });
});