import { describe, it, expect, beforeEach, vi } from 'vitest';
import express, { Application } from 'express';
import request from 'supertest';
import knowledgeSourcesRouter from '../knowledgeSources';
import { knowledgeSourceRepository, shopRepository } from '../../db/postgres/repositories';

// Mock the repositories
vi.mock('../../db/postgres/repositories', () => ({
  knowledgeSourceRepository: {
    findByShopId: vi.fn(),
    create: vi.fn(),
    findById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    updateStatus: vi.fn(),
  },
  shopRepository: {
    findById: vi.fn(),
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

describe('Knowledge Sources API', () => {
  let app: Application;
  
  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/shops', knowledgeSourcesRouter);
    app.use('/', knowledgeSourcesRouter);
    
    // Reset mocks
    vi.clearAllMocks();
  });

  describe('GET /shops/:shopId/knowledge-sources', () => {
    it('should return all knowledge sources for a shop', async () => {
      const shopId = '1';
      const mockShop = { id: shopId, name: 'Test Shop' };
      const mockKnowledgeSources = [
        { id: '1', shopId, name: 'Source 1', type: 'text', source: 'Content 1' },
        { id: '2', shopId, name: 'Source 2', type: 'url', source: 'http://example.com' },
      ];
      
      (shopRepository as any).findById.mockResolvedValue(mockShop);
      (knowledgeSourceRepository as any).findByShopId.mockResolvedValue(mockKnowledgeSources);
      
      const response = await request(app)
        .get(`/shops/${shopId}/knowledge-sources`)
        .set('Authorization', 'Bearer test-api-key');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockKnowledgeSources);
      expect(shopRepository.findById).toHaveBeenCalledWith(shopId);
      expect(knowledgeSourceRepository.findByShopId).toHaveBeenCalledWith(shopId);
    });
    
    it('should return 404 if shop is not found', async () => {
      const shopId = '1';
      
      (shopRepository as any).findById.mockResolvedValue(null);
      
      const response = await request(app)
        .get(`/shops/${shopId}/knowledge-sources`)
        .set('Authorization', 'Bearer test-api-key');
      
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Shop not found' });
    });
  });

  describe('POST /shops/:shopId/knowledge-sources', () => {
    it('should create a new knowledge source', async () => {
      const shopId = '1';
      const mockShop = { id: shopId, name: 'Test Shop' };
      const newKnowledgeSource = { 
        name: 'New Source', 
        type: 'text', 
        source: 'Sample content' 
      };
      const createdKnowledgeSource = { 
        id: '1', 
        shopId, 
        ...newKnowledgeSource,
        status: 'pending'
      };
      
      (shopRepository as any).findById.mockResolvedValue(mockShop);
      (knowledgeSourceRepository as any).create.mockResolvedValue(createdKnowledgeSource);
      
      const response = await request(app)
        .post(`/shops/${shopId}/knowledge-sources`)
        .set('Authorization', 'Bearer test-api-key')
        .send(newKnowledgeSource);
      
      expect(response.status).toBe(201);
      expect(response.body).toEqual(createdKnowledgeSource);
      expect(shopRepository.findById).toHaveBeenCalledWith(shopId);
      expect(knowledgeSourceRepository.create).toHaveBeenCalledWith({
        shopId,
        ...newKnowledgeSource,
        status: 'pending'
      });
    });
    
    it('should return 400 if required fields are missing', async () => {
      const shopId = '1';
      const mockShop = { id: shopId, name: 'Test Shop' };
      
      (shopRepository as any).findById.mockResolvedValue(mockShop);
      
      const response = await request(app)
        .post(`/shops/${shopId}/knowledge-sources`)
        .set('Authorization', 'Bearer test-api-key')
        .send({ name: 'New Source' });
      
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Name, type, and source are required' });
    });
    
    it('should return 400 if type is invalid', async () => {
      const shopId = '1';
      const mockShop = { id: shopId, name: 'Test Shop' };
      
      (shopRepository as any).findById.mockResolvedValue(mockShop);
      
      const response = await request(app)
        .post(`/shops/${shopId}/knowledge-sources`)
        .set('Authorization', 'Bearer test-api-key')
        .send({ 
          name: 'New Source', 
          type: 'invalid-type', 
          source: 'Sample content' 
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Type must be one of: text, url' });
    });
  });

  describe('PATCH /knowledge-sources/:id/status', () => {
    it('should update the status of a knowledge source', async () => {
      const id = '1';
      const mockKnowledgeSource = { 
        id, 
        shopId: '1', 
        name: 'Source 1', 
        type: 'text', 
        source: 'Content 1' 
      };
      const updatedKnowledgeSource = { 
        ...mockKnowledgeSource, 
        status: 'ready' 
      };
      
      (knowledgeSourceRepository as any).findById.mockResolvedValue(mockKnowledgeSource);
      (knowledgeSourceRepository as any).updateStatus.mockResolvedValue(updatedKnowledgeSource);
      
      const response = await request(app)
        .patch(`/knowledge-sources/${id}/status`)
        .set('Authorization', 'Bearer test-api-key')
        .send({ status: 'ready' });
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(updatedKnowledgeSource);
      expect(knowledgeSourceRepository.findById).toHaveBeenCalledWith(id);
      expect(knowledgeSourceRepository.updateStatus).toHaveBeenCalledWith(id, 'ready');
    });
    
    it('should return 400 if status is invalid', async () => {
      const id = '1';
      const mockKnowledgeSource = { 
        id, 
        shopId: '1', 
        name: 'Source 1', 
        type: 'text', 
        source: 'Content 1' 
      };
      
      (knowledgeSourceRepository as any).findById.mockResolvedValue(mockKnowledgeSource);
      
      const response = await request(app)
        .patch(`/knowledge-sources/${id}/status`)
        .set('Authorization', 'Bearer test-api-key')
        .send({ status: 'invalid-status' });
      
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Status must be one of: pending, processing, ready, error' });
    });
  });
});