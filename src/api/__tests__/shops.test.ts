import { describe, it, expect, beforeEach, vi } from 'vitest';
import express, { Application } from 'express';
import request from 'supertest';
import shopsRouter from '../shops';
import { 
  shopRepository, 
  BusinessOwnerRepository 
} from '../../db/postgres/repositories';

// Mock the repositories
vi.mock('../../db/postgres/repositories', () => ({
  shopRepository: {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findByBusinessOwnerId: vi.fn(),
  },
  BusinessOwnerRepository: vi.fn().mockImplementation(() => ({
    findById: vi.fn(),
  })),
  settingRepository: {
    findByShopId: vi.fn(),
  },
  knowledgeSourceRepository: {
    findByShopId: vi.fn(),
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

describe('Shops API', () => {
  let app: Application;
  
  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/shops', shopsRouter);
    
    // Reset mocks
    vi.clearAllMocks();
  });

  describe('GET /shops', () => {
    it('should return all shops', async () => {
      const mockShops = [
        { id: '1', name: 'Shop 1', businessOwnerId: '1' },
        { id: '2', name: 'Shop 2', businessOwnerId: '2' },
      ];
      
      (shopRepository as any).findAll.mockResolvedValue(mockShops);
      
      const response = await request(app)
        .get('/shops')
        .set('Authorization', 'Bearer test-api-key');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockShops);
      expect(shopRepository.findAll).toHaveBeenCalled();
    });
    
    it('should return 500 if there is an error', async () => {
      (shopRepository as any).findAll.mockRejectedValue(new Error('Database error'));
      
      const response = await request(app)
        .get('/shops')
        .set('Authorization', 'Bearer test-api-key');
      
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to fetch shops' });
    });
  });

  describe('POST /shops', () => {
    it('should create a new shop', async () => {
      const newShop = { name: 'New Shop', businessOwnerId: '1' };
      const createdShop = { id: '1', ...newShop };
      const mockBusinessOwner = { id: '1', name: 'John Doe', email: 'john@example.com' };
      
      // Mock BusinessOwnerRepository
      const mockBusinessOwnerRepo = {
        findById: vi.fn().mockResolvedValue(mockBusinessOwner)
      };
      (BusinessOwnerRepository as any).mockImplementation(() => mockBusinessOwnerRepo);
      
      (shopRepository as any).create.mockResolvedValue(createdShop);
      
      const response = await request(app)
        .post('/shops')
        .set('Authorization', 'Bearer test-api-key')
        .send(newShop);
      
      expect(response.status).toBe(201);
      expect(response.body).toEqual(createdShop);
      expect(mockBusinessOwnerRepo.findById).toHaveBeenCalledWith('1');
      expect(shopRepository.create).toHaveBeenCalledWith(newShop);
    });
    
    it('should return 400 if name or businessOwnerId is missing', async () => {
      const response = await request(app)
        .post('/shops')
        .set('Authorization', 'Bearer test-api-key')
        .send({ name: 'New Shop' });
      
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Name and businessOwnerId are required' });
    });
    
    it('should return 400 if business owner is not found', async () => {
      const newShop = { name: 'New Shop', businessOwnerId: '1' };
      
      // Mock BusinessOwnerRepository
      const mockBusinessOwnerRepo = {
        findById: vi.fn().mockResolvedValue(null)
      };
      (BusinessOwnerRepository as any).mockImplementation(() => mockBusinessOwnerRepo);
      
      const response = await request(app)
        .post('/shops')
        .set('Authorization', 'Bearer test-api-key')
        .send(newShop);
      
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Business owner not found' });
    });
  });
});