import PostgresConnection from './postgres/connection';
import MongoConnection from './mongodb/connection';
import RedisConnection from './redis/connection';

import {
  businessOwnerRepository,
  shopRepository,
  settingRepository,
  knowledgeSourceRepository,
} from './postgres/repositories';

import {
  lineMessageRepository,
  facebookMessageRepository,
} from './mongodb/repositories';

import {
  cacheRepository,
  lockRepository,
} from './redis/repositories';

// Initialize connections
export async function initializeDatabaseConnections(): Promise<void> {
  try {
    // Initialize PostgreSQL connection
    await PostgresConnection.getInstance().connect();
    
    // Initialize MongoDB connection
    await MongoConnection.getInstance().connect();
    
    // Initialize Redis connection
    await RedisConnection.getInstance().connect();
    
    console.log('All database connections initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database connections:', error);
    throw error;
  }
}

// Close connections
export async function closeDatabaseConnections(): Promise<void> {
  try {
    // Close PostgreSQL connection
    await PostgresConnection.getInstance().disconnect();
    
    // Close MongoDB connection
    await MongoConnection.getInstance().disconnect();
    
    // Close Redis connection
    await RedisConnection.getInstance().disconnect();
    
    console.log('All database connections closed successfully');
  } catch (error) {
    console.error('Error closing database connections:', error);
    throw error;
  }
}

// Export repositories
export {
  // PostgreSQL repositories
  businessOwnerRepository,
  shopRepository,
  settingRepository,
  knowledgeSourceRepository,
  
  // MongoDB repositories
  lineMessageRepository,
  facebookMessageRepository,
  
  // Redis repositories
  cacheRepository,
  lockRepository,
};

// Export connection classes
export {
  PostgresConnection,
  MongoConnection,
  RedisConnection,
};