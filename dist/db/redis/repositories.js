"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.lockRepository = exports.cacheRepository = exports.LockRepository = exports.CacheRepository = void 0;
const connection_1 = __importDefault(require("./connection"));
const logger_1 = __importDefault(require("../../utils/logger"));
class CacheRepository {
    constructor() {
        this.redis = connection_1.default.getInstance().getClient();
    }
    async set(key, value, expirySeconds) {
        try {
            if (expirySeconds) {
                await this.redis.setex(key, expirySeconds, value);
            }
            else {
                await this.redis.set(key, value);
            }
            logger_1.default.debug(`Set cache key: ${key}`);
        }
        catch (error) {
            logger_1.default.error(`Error setting cache key ${key}:`, error);
            throw error;
        }
    }
    async get(key) {
        try {
            const value = await this.redis.get(key);
            logger_1.default.debug(`Got cache key: ${key}`);
            return value;
        }
        catch (error) {
            logger_1.default.error(`Error getting cache key ${key}:`, error);
            throw error;
        }
    }
    async delete(key) {
        try {
            const result = await this.redis.del(key);
            logger_1.default.debug(`Deleted cache key: ${key}`);
            return result;
        }
        catch (error) {
            logger_1.default.error(`Error deleting cache key ${key}:`, error);
            throw error;
        }
    }
    async exists(key) {
        try {
            const result = await this.redis.exists(key);
            return result === 1;
        }
        catch (error) {
            logger_1.default.error(`Error checking existence of cache key ${key}:`, error);
            throw error;
        }
    }
    async expire(key, seconds) {
        try {
            const result = await this.redis.expire(key, seconds);
            return result === 1;
        }
        catch (error) {
            logger_1.default.error(`Error setting expiration for cache key ${key}:`, error);
            throw error;
        }
    }
    async flushAll() {
        try {
            await this.redis.flushall();
            logger_1.default.info('Flushed all cache');
        }
        catch (error) {
            logger_1.default.error('Error flushing all cache:', error);
            throw error;
        }
    }
}
exports.CacheRepository = CacheRepository;
class LockRepository {
    constructor() {
        this.redis = connection_1.default.getInstance().getClient();
    }
    async acquireLock(lockKey, lockValue, timeoutSeconds) {
        try {
            const result = await this.redis.set(lockKey, lockValue, 'EX', timeoutSeconds, 'NX');
            const acquired = result === 'OK';
            if (acquired) {
                logger_1.default.debug(`Acquired lock: ${lockKey}`);
            }
            return acquired;
        }
        catch (error) {
            logger_1.default.error(`Error acquiring lock ${lockKey}:`, error);
            throw error;
        }
    }
    async releaseLock(lockKey, lockValue) {
        try {
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
                logger_1.default.debug(`Released lock: ${lockKey}`);
            }
            return released;
        }
        catch (error) {
            logger_1.default.error(`Error releasing lock ${lockKey}:`, error);
            throw error;
        }
    }
    async isLocked(lockKey) {
        try {
            const result = await this.redis.exists(lockKey);
            return result === 1;
        }
        catch (error) {
            logger_1.default.error(`Error checking if lock ${lockKey} is active:`, error);
            throw error;
        }
    }
    async getLockValue(lockKey) {
        try {
            return await this.redis.get(lockKey);
        }
        catch (error) {
            logger_1.default.error(`Error getting lock value for ${lockKey}:`, error);
            throw error;
        }
    }
}
exports.LockRepository = LockRepository;
exports.cacheRepository = new CacheRepository();
exports.lockRepository = new LockRepository();
//# sourceMappingURL=repositories.js.map