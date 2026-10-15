import express, { Express } from 'express';

const createApp = (): Express => {
  const app = express();

  // Middleware to parse JSON bodies
  app.use(express.json());

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  return app;
};

export default createApp;
