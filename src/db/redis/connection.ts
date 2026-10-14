import Redis from 'ioredis';
import logger from '../../utils/logger';

class RedisConnection {
  private static instance: RedisConnection;
  private redis: Redis | null = null;

  private constructor() {
    // In test environment, we don't require REDIS_URL
    if (!process.env.REDIS_URL && process.env.NODE_ENV !== 'test') {
      throw new Error('REDIS_URL environment variable is required');
    }
  }

  public static getInstance(): RedisConnection {
    if (!RedisConnection.instance) {
      RedisConnection.instance = new RedisConnection();
    }
    return RedisConnection.instance;
  }

  public async connect(): Promise<void> {
    // Skip connection in test environment
    if (process.env.NODE_ENV === 'test') {
      logger.info('Skipping Redis connection in test environment');
      return;
    }

    try {
      this.redis = new Redis(process.env.REDIS_URL!, {
        lazyConnect: true,
        maxRetriesPerRequest: 3,
      });

      this.redis.on('connect', () => {
        logger.info('Connected to Redis');
      });

      this.redis.on('ready', () => {
        logger.info('Redis client is ready');
      });

      this.redis.on('error', (err: any) => {
        logger.error('Redis connection error:', err);
      });

      this.redis.on('close', () => {
        logger.info('Redis connection closed');
      });

      this.redis.on('reconnecting', () => {
        logger.info('Reconnecting to Redis');
      });

      this.redis.on('end', () => {
        logger.info('Redis connection ended');
      });

      await this.redis.connect();
    } catch (error: any) {
      logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  public getClient(): Redis {
    if (!this.redis && process.env.NODE_ENV !== 'test') {
      throw new Error('Redis client is not connected');
    }
    // Return a mock client in test environment
    if (process.env.NODE_ENV === 'test') {
      return new Redis() as Redis;
    }
    return this.redis!;
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.redis) {
        await this.redis.quit();
        logger.info('Disconnected from Redis');
      }
    } catch (error: any) {
      logger.error('Error disconnecting from Redis:', error);
      throw error;
    }
  }

  public isConnected(): boolean {
    return this.redis !== null && this.redis.status === 'ready';
  }
}

export default RedisConnection;