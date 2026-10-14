import { PrismaClient } from '@prisma/client';
import logger from '../../utils/logger';

class PostgresConnection {
  private static instance: PostgresConnection;
  private prisma: PrismaClient;

  private constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    this.prisma = new PrismaClient();
  }

  public static getInstance(): PostgresConnection {
    if (!PostgresConnection.instance) {
      PostgresConnection.instance = new PostgresConnection();
    }
    return PostgresConnection.instance;
  }

  public getClient(): PrismaClient {
    return this.prisma;
  }

  public async connect(): Promise<void> {
    try {
      await this.prisma.$connect();
      logger.info('Connected to PostgreSQL database');
    } catch (error: any) {
      logger.error('Failed to connect to PostgreSQL database', { error: error.message || error });
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      logger.info('Disconnected from PostgreSQL database');
    } catch (error: any) {
      logger.error('Error disconnecting from PostgreSQL database', { error: error.message || error });
      throw error;
    }
  }
}

export default PostgresConnection;