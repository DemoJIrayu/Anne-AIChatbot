import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * Simple API key authentication middleware
 * Checks for a static API key in the Authorization header
 */
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.get('Authorization');
  
  if (!authHeader) {
    logger.warn('Missing Authorization header');
    res.status(401).json({ error: 'Missing Authorization header' });
    return;
  }
  
  const [type, token] = authHeader.split(' ');
  
  if (type !== 'Bearer') {
    logger.warn('Invalid Authorization header format');
    res.status(401).json({ error: 'Invalid Authorization header format' });
    return;
  }
  
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    // In test environment, allow access if no API key is configured
    if (process.env.NODE_ENV === 'test') {
      next();
      return;
    }
    
    logger.error('API_KEY not configured in environment');
    res.status(500).json({ error: 'Server configuration error' });
    return;
  }
  
  if (token !== apiKey) {
    logger.warn('Invalid API key');
    res.status(401).json({ error: 'Invalid API key' });
    return;
  }
  
  next();
};