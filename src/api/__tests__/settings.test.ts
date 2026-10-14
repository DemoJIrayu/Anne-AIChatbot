import { describe, it, expect, beforeEach, vi } from 'vitest';
import express, { Application } from 'express';
import request from 'supertest';
import settingsRouter from '../settings';
import { settingRepository, shopRepository } from '../../db/postgres/repositories';

// Mock the repositories
vi.mock('../../db/postgres/repositories', () => ({
  settingRepository: {
    findByShopId: vi.fn(),
    updateByShopId: vi.fn(),
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

describe('Settings API', () => {
  let app: Application;
  
  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/shops', settingsRouter);
    
    // Reset mocks
    vi.clearAllMocks();
  });

  describe('GET /shops/:shopId/settings', () => {
    it('should return settings for a shop', async () => {
      const shopId = '1';
      const mockShop = { id: shopId, name: 'Test Shop' };
      const mockSettings = { 
        id: '1', 
        shopId, 
        autoReply: true, 
        welcomeMessage: 'Welcome!' 
      };
      
      (shopRepository as any).findById.mockResolvedValue(mockShop);
      (settingRepository as any).findByShopId.mockResolvedValue(mockSettings);
      
      const response = await request(app)
        .get(`/shops/${shopId}/settings`)
        .set('Authorization', 'Bearer test-api-key');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockSettings);
      expect(shopRepository.findById).toHaveBeenCalledWith(shopId);
      expect(settingRepository.findByShopId).toHaveBeenCalledWith(shopId);
    });
    
    it('should return 404 if shop is not found', async () => {
      const shopId = '1';
      
      (shopRepository as any).findById.mockResolvedValue(null);
      
      const response = await request(app)
        .get(`/shops/${shopId}/settings`)
        .set('Authorization', 'Bearer test-api-key');
      
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Shop not found' });
    });
  });

  describe('PUT /shops/:shopId/settings', () => {
    it('should update settings for a shop', async () => {
      const shopId = '1';
      const mockShop = { id: shopId, name: 'Test Shop' };
      const updatedSettings = { 
        autoReply: false, 
        welcomeMessage: 'New welcome message',
        confidenceThreshold: 0.8
      };
      const mockSettings = { 
        id: '1', 
        shopId, 
        ...updatedSettings 
      };
      
      (shopRepository as any).findById.mockResolvedValue(mockShop);
      (settingRepository as any).updateByShopId.mockResolvedValue(mockSettings);
      
      const response = await request(app)
        .put(`/shops/${shopId}/settings`)
        .set('Authorization', 'Bearer test-api-key')
        .send(updatedSettings);
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockSettings);
      expect(shopRepository.findById).toHaveBeenCalledWith(shopId);
      expect(settingRepository.updateByShopId).toHaveBeenCalledWith(shopId, updatedSettings);
    });
    
    it('should return 400 if confidence threshold is invalid', async () => {
      const shopId = '1';
      const mockShop = { id: shopId, name: 'Test Shop' };
      
      (shopRepository as any).findById.mockResolvedValue(mockShop);
      
      const response = await request(app)
        .put(`/shops/${shopId}/settings`)
        .set('Authorization', 'Bearer test-api-key')
        .send({ confidenceThreshold: 1.5 });
      
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Confidence threshold must be between 0 and 1' });
    });
  });

  describe('PATCH /shops/:shopId/settings/auto-reply', () => {
    it('should toggle auto-reply for a shop', async () => {
      const shopId = '1';
      const mockShop = { id: shopId, name: 'Test Shop' };
      const mockSettings = { 
        id: '1', 
        shopId, 
        autoReply: true 
      };
      
      (shopRepository as any).findById.mockResolvedValue(mockShop);
      (settingRepository as any).updateByShopId.mockResolvedValue(mockSettings);
      
      const response = await request(app)
        .patch(`/shops/${shopId}/settings/auto-reply`)
        .set('Authorization', 'Bearer test-api-key')
        .send({ enabled: false });
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockSettings);
      expect(shopRepository.findById).toHaveBeenCalledWith(shopId);
      expect(settingRepository.updateByShopId).toHaveBeenCalledWith(shopId, { autoReply: false });
    });
    
    it('should return 400 if enabled is not a boolean', async () => {
      const shopId = '1';
      const mockShop = { id: shopId, name: 'Test Shop' };
      
      (shopRepository as any).findById.mockResolvedValue(mockShop);
      
      const response = await request(app)
        .patch(`/shops/${shopId}/settings/auto-reply`)
        .set('Authorization', 'Bearer test-api-key')
        .send({ enabled: 'not-a-boolean' });
      
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Enabled must be a boolean value' });
    });
  });
});