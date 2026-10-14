import mongoose, { Connection } from 'mongoose';
import logger from '../../utils/logger';

class MongoConnection {
  private static instance: MongoConnection;
  private connection: Connection | null = null;

  private constructor() {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is required');
    }
  }

  public static getInstance(): MongoConnection {
    if (!MongoConnection.instance) {
      MongoConnection.instance = new MongoConnection();
    }
    return MongoConnection.instance;
  }

  public async connect(): Promise<void> {
    try {
      mongoose.set('debug', process.env.NODE_ENV === 'development');
      
      await mongoose.connect(process.env.MONGODB_URI!);
      
      this.connection = mongoose.connection;
      
      this.connection.on('connected', () => {
        logger.info('Connected to MongoDB database');
      });

      this.connection.on('error', (err: any) => {
        logger.error('MongoDB connection error:', err);
      });

      this.connection.on('disconnected', () => {
        logger.info('Disconnected from MongoDB database');
      });

      // Handle process termination
      process.on('SIGINT', async () => {
        await this.disconnect();
        process.exit(0);
      });
    } catch (error: any) {
      logger.error('Failed to connect to MongoDB database:', error);
      throw error;
    }
  }

  public getConnection(): Connection | null {
    return this.connection;
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.connection) {
        await mongoose.disconnect();
        logger.info('Disconnected from MongoDB database');
      }
    } catch (error: any) {
      logger.error('Error disconnecting from MongoDB database:', error);
      throw error;
    }
  }
}

export default MongoConnection;