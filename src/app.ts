import express, { Application, Request, Response } from 'express';
import logger from './utils/logger';
import { verifyWebhook, handleWebhook as handleFacebookWebhook, initializeFacebookIntegration } from './integrations/facebook';
import { verifySignature, handleWebhook as handleLineWebhook, initializeLineIntegration } from './integrations/line';
import apiRouter from './api';
import { PrismaClient } from '@prisma/client';

class App {
  public app: Application;
  public port: number;
  private prisma: PrismaClient;

  constructor(port: number) {
    this.app = express();
    this.port = port;
    this.prisma = new PrismaClient();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeIntegrations();
  }

  private initializeMiddlewares(): void {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    
    // Request logging middleware
    this.app.use((req, res, next) => {
      logger.info('Incoming request', {
        method: req.method,
        url: req.url,
        ip: req.ip
      });
      next();
    });
  }

  private initializeRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req: Request, res: Response) => {
      res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    });

    // API routes
    this.app.use('/api', apiRouter);

    // Facebook webhook routes
    this.app.get('/webhook/facebook', verifyWebhook);
    this.app.post('/webhook/facebook', handleFacebookWebhook);

    // LINE webhook routes
    this.app.post('/webhook/line', verifySignature, handleLineWebhook);

    // 404 handler
    this.app.use('*', (req: Request, res: Response) => {
      res.status(404).json({
        status: 'error',
        message: 'Route not found'
      });
    });
  }

  private initializeIntegrations(): void {
    // Initialize Facebook and LINE integrations with Prisma client
    initializeFacebookIntegration(this.prisma);
    initializeLineIntegration(this.prisma);
  }

  public async listen(): Promise<void> {
    try {
      await this.prisma.$connect();
      logger.info('Connected to PostgreSQL database');
      
      this.app.listen(this.port, () => {
        logger.info(`Server started on port ${this.port}`, {
          port: this.port,
          environment: process.env.NODE_ENV
        });
      });
    } catch (error: any) {
      logger.error('Failed to start server', { error: error.message || error });
      process.exit(1);
    }
  }

  public async close(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

export default App;