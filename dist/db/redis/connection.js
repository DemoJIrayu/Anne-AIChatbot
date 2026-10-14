"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ioredis_1 = __importDefault(require("ioredis"));
const logger_1 = __importDefault(require("../../utils/logger"));
class RedisConnection {
    constructor() {
        this.redis = null;
        if (!process.env.REDIS_URL && process.env.NODE_ENV !== 'test') {
            throw new Error('REDIS_URL environment variable is required');
        }
    }
    static getInstance() {
        if (!RedisConnection.instance) {
            RedisConnection.instance = new RedisConnection();
        }
        return RedisConnection.instance;
    }
    async connect() {
        if (process.env.NODE_ENV === 'test') {
            logger_1.default.info('Skipping Redis connection in test environment');
            return;
        }
        try {
            this.redis = new ioredis_1.default(process.env.REDIS_URL, {
                lazyConnect: true,
                maxRetriesPerRequest: 3,
            });
            this.redis.on('connect', () => {
                logger_1.default.info('Connected to Redis');
            });
            this.redis.on('ready', () => {
                logger_1.default.info('Redis client is ready');
            });
            this.redis.on('error', (err) => {
                logger_1.default.error('Redis connection error:', err);
            });
            this.redis.on('close', () => {
                logger_1.default.info('Redis connection closed');
            });
            this.redis.on('reconnecting', () => {
                logger_1.default.info('Reconnecting to Redis');
            });
            this.redis.on('end', () => {
                logger_1.default.info('Redis connection ended');
            });
            await this.redis.connect();
        }
        catch (error) {
            logger_1.default.error('Failed to connect to Redis:', error);
            throw error;
        }
    }
    getClient() {
        if (!this.redis && process.env.NODE_ENV !== 'test') {
            throw new Error('Redis client is not connected');
        }
        if (process.env.NODE_ENV === 'test') {
            return new ioredis_1.default();
        }
        return this.redis;
    }
    async disconnect() {
        try {
            if (this.redis) {
                await this.redis.quit();
                logger_1.default.info('Disconnected from Redis');
            }
        }
        catch (error) {
            logger_1.default.error('Error disconnecting from Redis:', error);
            throw error;
        }
    }
    isConnected() {
        return this.redis !== null && this.redis.status === 'ready';
    }
}
exports.default = RedisConnection;
//# sourceMappingURL=connection.js.map