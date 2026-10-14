import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  logLevel: string;
  logFormat: 'json' | 'simple';
}

const config: Config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  logFormat: (process.env.LOG_FORMAT as 'json' | 'simple') || 'simple',
};

export default config;