import RedisConnection from './connection';
import logger from '../../utils/logger';

export class CacheRepository {
  private redis = RedisConnection.getInstance().getClient();

  async set(key: string, value: string, expirySeconds?: number): Promise<void> {
    try {
      if (expirySeconds) {
        await this.redis.setex(key, expirySeconds, value);
      } else {
        await this.redis.set(key, value);
      }
      logger.debug(`Set cache key: ${key}`);
    } catch (error: any) {
      logger.error(`Error setting cache key ${key}:`, error);
      throw error;
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      const value = await this.redis.get(key);
      logger.debug(`Got cache key: ${key}`);
      return value;
    } catch (error: any) {
      logger.error(`Error getting cache key ${key}:`, error);
      throw error;
    }
  }

  async delete(key: string): Promise<number> {
    try {
      const result = await this.redis.del(key);
      logger.debug(`Deleted cache key: ${key}`);
      return result;
    } catch (error: any) {
      logger.error(`Error deleting cache key ${key}:`, error);
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error: any) {
      logger.error(`Error checking existence of cache key ${key}:`, error);
      throw error;
    }
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      const result = await this.redis.expire(key, seconds);
      return result === 1;
    } catch (error: any) {
      logger.error(`Error setting expiration for cache key ${key}:`, error);
      throw error;
    }
  }

  async flushAll(): Promise<void> {
    try {
      await this.redis.flushall();
      logger.info('Flushed all cache');
    } catch (error: any) {
      logger.error('Error flushing all cache:', error);
      throw error;
    }
  }
}

export class LockRepository {
  private redis = RedisConnection.getInstance().getClient();

  async acquireLock(lockKey: string, lockValue: string, timeoutSeconds: number): Promise<boolean> {
    try {
      // Using SET with NX and EX options to acquire lock atomically
      const result = await this.redis.set(lockKey, lockValue, 'EX', timeoutSeconds, 'NX');
      const acquired = result === 'OK';
      if (acquired) {
        logger.debug(`Acquired lock: ${lockKey}`);
      }
      return acquired;
    } catch (error: any) {
      logger.error(`Error acquiring lock ${lockKey}:`, error);
      throw error;
    }
  }

  async releaseLock(lockKey: string, lockValue: string): Promise<boolean> {
    try {
      // Lua script to safely release lock only if it matches our lock value
      const script = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `;
      const result = await this.redis.eval(script, 1, lockKey, lockValue);
      const released = result === 1;
      if (released) {
        logger.debug(`Released lock: ${lockKey}`);
      }
      return released;
    } catch (error: any) {
      logger.error(`Error releasing lock ${lockKey}:`, error);
      throw error;
    }
  }

  async isLocked(lockKey: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(lockKey);
      return result === 1;
    } catch (error: any) {
      logger.error(`Error checking if lock ${lockKey} is active:`, error);
      throw error;
    }
  }

  async getLockValue(lockKey: string): Promise<string | null> {
    try {
      return await this.redis.get(lockKey);
    } catch (error: any) {
      logger.error(`Error getting lock value for ${lockKey}:`, error);
      throw error;
    }
  }
}

// Export singleton instances
export const cacheRepository = new CacheRepository();
export const lockRepository = new LockRepository();