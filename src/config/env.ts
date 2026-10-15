import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Validate and parse PORT
const portValue = process.env.PORT ?? '3000';
const PORT = parseInt(portValue, 10);

// Check if PORT is a valid number and within valid range
if (isNaN(PORT) || portValue.trim() !== portValue || !/^\d+$/.test(portValue)) {
  console.error(`Invalid PORT value: ${portValue}. PORT must be a valid number without trailing characters.`);
  process.exit(1);
}

// Check if PORT is within valid TCP port range (1-65535)
if (PORT < 1 || PORT > 65535) {
  console.error(`Invalid PORT value: ${PORT}. PORT must be between 1 and 65535.`);
  process.exit(1);
}

// Validate NODE_ENV
const VALID_NODE_ENVS = ['development', 'production', 'test'] as const;
type NodeEnv = (typeof VALID_NODE_ENVS)[number];

const NODE_ENV = (process.env.NODE_ENV ?? 'development') as NodeEnv;
if (!VALID_NODE_ENVS.includes(NODE_ENV)) {
  console.error(
    `Invalid NODE_ENV value: ${NODE_ENV}. Must be one of: ${VALID_NODE_ENVS.join(', ')}`
  );
  process.exit(1);
}

// Validate DATABASE_URL
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL is required but was not provided.');
  process.exit(1);
}

// Check that DATABASE_URL starts with postgres:// or postgresql://
if (!DATABASE_URL.startsWith('postgres://') && !DATABASE_URL.startsWith('postgresql://')) {
  console.error('DATABASE_URL must start with "postgres://" or "postgresql://".');
  process.exit(1);
}

export { PORT, NODE_ENV, DATABASE_URL };

// Export validation functions for testing
export const validateDatabaseUrl = (databaseUrl: string | undefined) => {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required but was not provided.');
  }

  if (!databaseUrl.startsWith('postgres://') && !databaseUrl.startsWith('postgresql://')) {
    throw new Error('DATABASE_URL must start with "postgres://" or "postgresql://".');
  }

  return databaseUrl;
};