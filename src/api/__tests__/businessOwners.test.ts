import { describe, it, expect, beforeEach, vi } from 'vitest';
import express, { Application } from 'express';
import request from 'supertest';
import businessOwnersRouter from '../businessOwners';
import { businessOwnerRepository, shopRepository } from '../../db/postgres/repositories';

// Mock the repositories
vi.mock('../../db/postgres/repositories', () => ({
  businessOwnerRepository: {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findByEmail: vi.fn(),
  },
  shopRepository: {
    findByBusinessOwnerId: vi.fn(),
  }
}));

// Mock logger
vi.mock('../../utils/logger', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }
}));

describe('Business Owners API', () => {
  let app: Application;
  
  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/business-owners', businessOwnersRouter);
    
    // Reset mocks
    vi.clearAllMocks();
  });

  describe('GET /business-owners', () => {
    it('should return all business owners', async () => {
      const mockOwners = [
        { id: '1', name: 'John Doe', email: 'john@example.com' },
        { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
      ];
      
      (businessOwnerRepository as any).findAll.mockResolvedValue(mockOwners);
      
      const response = await request(app)
        .get('/business-owners')
        .set('Authorization', 'Bearer test-api-key');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockOwners);
      expect(businessOwnerRepository.findAll).toHaveBeenCalled();
    });
    
    it('should return 500 if there is an error', async () => {
      (businessOwnerRepository as any).findAll.mockRejectedValue(new Error('Database error'));
      
      const response = await request(app)
        .get('/business-owners')
        .set('Authorization', 'Bearer test-api-key');
      
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to fetch business owners' });
    });
  });

  describe('POST /business-owners', () => {
    it('should create a new business owner', async () => {
      const newOwner = { name: 'John Doe', email: 'john@example.com' };
      const createdOwner = { id: '1', ...newOwner };
      
      (businessOwnerRepository as any).findByEmail.mockResolvedValue(null);
      (businessOwnerRepository as any).create.mockResolvedValue(createdOwner);
      
      const response = await request(app)
        .post('/business-owners')
        .set('Authorization', 'Bearer test-api-key')
        .send(newOwner);
      
      expect(response.status).toBe(201);
      expect(response.body).toEqual(createdOwner);
      expect(businessOwnerRepository.findByEmail).toHaveBeenCalledWith('john@example.com');
      expect(businessOwnerRepository.create).toHaveBeenCalledWith(newOwner);
    });
    
    it('should return 400 if name or email is missing', async () => {
      const response = await request(app)
        .post('/business-owners')
        .set('Authorization', 'Bearer test-api-key')
        .send({ name: 'John Doe' });
      
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Name and email are required' });
    });
    
    it('should return 409 if business owner with email already exists', async () => {
      const newOwner = { name: 'John Doe', email: 'john@example.com' };
      const existingOwner = { id: '1', ...newOwner };
      
      (businessOwnerRepository as any).findByEmail.mockResolvedValue(existingOwner);
      
      const response = await request(app)
        .post('/business-owners')
        .set('Authorization', 'Bearer test-api-key')
        .send(newOwner);
      
      expect(response.status).toBe(409);
      expect(response.body).toEqual({ error: 'Business owner with this email already exists' });
    });
  });

  describe('Authentication', () => {
    it('should return 401 if no authorization header is provided', async () => {
      const response = await request(app)
        .get('/business-owners');
      
      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Missing Authorization header' });
    });
    
    it('should return 401 if invalid authorization header format is provided', async () => {
      const response = await request(app)
        .get('/business-owners')
        .set('Authorization', 'InvalidFormat');
      
      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Invalid Authorization header format' });
    });
  });
});