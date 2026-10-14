import { describe, it, expect, beforeEach, vi } from 'vitest';
import express, { Application } from 'express';
import request from 'supertest';

// Mock the database repositories to avoid connection issues in this test
vi.mock('../../db/postgres/repositories', () => ({
  businessOwnerRepository: {},
  shopRepository: {},
  settingRepository: {},
  knowledgeSourceRepository: {}
}));

// Mock the middleware to bypass authentication for this test
vi.mock('../middleware', () => ({
  authenticate: (req: any, res: any, next: any) => next()
}));

import apiRouter from '../index';

describe('API Router', () => {
  let app: Application;
  
  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api', apiRouter);
  });

  it('should mount all API routes', async () => {
    // Test that the business owners route is mounted
    const businessOwnersResponse = await request(app)
      .get('/api/business-owners')
      .set('Authorization', 'Bearer invalid-key');
    
    // Should get 500 (internal server error due to mocked repos) rather than 404 (not found)
    expect([500, 401]).toContain(businessOwnersResponse.status);
    
    // Test that the shops route is mounted
    const shopsResponse = await request(app)
      .get('/api/shops')
      .set('Authorization', 'Bearer invalid-key');
    
    // Should get 500 (internal server error due to mocked repos) rather than 404 (not found)
    expect([500, 401]).toContain(shopsResponse.status);
  });
});