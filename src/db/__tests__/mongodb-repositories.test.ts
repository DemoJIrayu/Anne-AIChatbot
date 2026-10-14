import { describe, it, beforeEach, vi, expect } from 'vitest';
import {
  LineMessageRepository,
  FacebookMessageRepository
} from '../mongodb/repositories';

// Mock the models
const mockLineMessage = {
  messageId: 'test-line-1',
  userId: 'user-1',
  shopId: 'shop-1',
  timestamp: new Date(),
  type: 'text',
  text: 'Hello',
  _id: '1',
  createdAt: new Date(),
  updatedAt: new Date(),
  save: vi.fn(),
};

const mockFacebookMessage = {
  messageId: 'test-fb-1',
  userId: 'user-1',
  shopId: 'shop-1',
  timestamp: new Date(),
  type: 'text',
  text: 'Hello',
  _id: '1',
  createdAt: new Date(),
  updatedAt: new Date(),
  save: vi.fn(),
};

const mockExecFn = vi.fn();

// Mock findOne return value
const mockFindOneReturn = {
  exec: mockExecFn,
};

// Mock find return value
const mockFindReturn = {
  sort: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  exec: mockExecFn,
};

vi.mock('../mongodb/models', () => {
  const LineMessageMock = vi.fn(() => ({
    save: vi.fn().mockResolvedValue(mockLineMessage),
  }));
  
  const FacebookMessageMock = vi.fn(() => ({
    save: vi.fn().mockResolvedValue(mockFacebookMessage),
  }));
  
  // Add static methods using defineProperty to avoid TypeScript errors
  Object.defineProperty(LineMessageMock, 'findOne', {
    value: vi.fn(() => mockFindOneReturn),
    writable: false
  });
  
  Object.defineProperty(LineMessageMock, 'find', {
    value: vi.fn(() => mockFindReturn),
    writable: false
  });
  
  Object.defineProperty(LineMessageMock, 'findOneAndUpdate', {
    value: vi.fn(() => mockFindOneReturn),
    writable: false
  });
  
  Object.defineProperty(LineMessageMock, 'findOneAndDelete', {
    value: vi.fn(() => mockFindOneReturn),
    writable: false
  });
  
  Object.defineProperty(FacebookMessageMock, 'findOne', {
    value: vi.fn(() => mockFindOneReturn),
    writable: false
  });
  
  Object.defineProperty(FacebookMessageMock, 'find', {
    value: vi.fn(() => mockFindReturn),
    writable: false
  });
  
  Object.defineProperty(FacebookMessageMock, 'findOneAndUpdate', {
    value: vi.fn(() => mockFindOneReturn),
    writable: false
  });
  
  Object.defineProperty(FacebookMessageMock, 'findOneAndDelete', {
    value: vi.fn(() => mockFindOneReturn),
    writable: false
  });
  
  return {
    LineMessage: LineMessageMock,
    FacebookMessage: FacebookMessageMock,
    __esModule: true,
  };
});

describe('MongoDB Repositories', () => {
  let lineMessageRepo: LineMessageRepository;
  let facebookMessageRepo: FacebookMessageRepository;

  beforeEach(() => {
    lineMessageRepo = new LineMessageRepository();
    facebookMessageRepo = new FacebookMessageRepository();
    // Reset mock executions
    mockExecFn.mockReset();
  });

  describe('LineMessageRepository', () => {
    it('should create a LINE message', async () => {
      const mockData: any = {
        messageId: 'test-line-1',
        userId: 'user-1',
        shopId: 'shop-1',
        timestamp: new Date(),
        type: 'text',
        text: 'Hello'
      };
      
      mockExecFn.mockResolvedValueOnce(mockLineMessage);
      
      const result = await lineMessageRepo.create(mockData);
      
      expect(result).toEqual(mockLineMessage);
    });

    it('should find LINE message by id', async () => {
      mockExecFn.mockResolvedValueOnce(mockLineMessage);
      
      const result = await lineMessageRepo.findById('test-line-1');
      
      expect(result).toEqual(mockLineMessage);
    });

    it('should find LINE messages by user id', async () => {
      mockExecFn.mockResolvedValueOnce([mockLineMessage]);
      
      const result = await lineMessageRepo.findByUserId('user-1', 5);
      
      expect(result).toEqual([mockLineMessage]);
    });

    it('should find LINE messages by shop id', async () => {
      mockExecFn.mockResolvedValueOnce([mockLineMessage]);
      
      const result = await lineMessageRepo.findByShopId('shop-1', 5);
      
      expect(result).toEqual([mockLineMessage]);
    });

    it('should update reply for LINE message', async () => {
      mockExecFn.mockResolvedValueOnce(mockLineMessage);
      
      const result = await lineMessageRepo.updateReply('test-line-1', 'reply text');
      
      expect(result).toEqual(mockLineMessage);
    });

    it('should delete LINE message by id', async () => {
      mockExecFn.mockResolvedValueOnce(mockLineMessage);
      
      const result = await lineMessageRepo.deleteById('test-line-1');
      
      expect(result).toEqual(mockLineMessage);
    });
  });

  describe('FacebookMessageRepository', () => {
    it('should create a Facebook message', async () => {
      const mockData: any = {
        messageId: 'test-fb-1',
        userId: 'user-1',
        shopId: 'shop-1',
        timestamp: new Date(),
        type: 'text',
        text: 'Hello'
      };
      
      mockExecFn.mockResolvedValueOnce(mockFacebookMessage);
      
      const result = await facebookMessageRepo.create(mockData);
      
      expect(result).toEqual(mockFacebookMessage);
    });

    it('should find Facebook message by id', async () => {
      mockExecFn.mockResolvedValueOnce(mockFacebookMessage);
      
      const result = await facebookMessageRepo.findById('test-fb-1');
      
      expect(result).toEqual(mockFacebookMessage);
    });

    it('should find Facebook messages by user id', async () => {
      mockExecFn.mockResolvedValueOnce([mockFacebookMessage]);
      
      const result = await facebookMessageRepo.findByUserId('user-1', 5);
      
      expect(result).toEqual([mockFacebookMessage]);
    });

    it('should find Facebook messages by shop id', async () => {
      mockExecFn.mockResolvedValueOnce([mockFacebookMessage]);
      
      const result = await facebookMessageRepo.findByShopId('shop-1', 5);
      
      expect(result).toEqual([mockFacebookMessage]);
    });

    it('should update reply for Facebook message', async () => {
      mockExecFn.mockResolvedValueOnce(mockFacebookMessage);
      
      const result = await facebookMessageRepo.updateReply('test-fb-1', 'reply text');
      
      expect(result).toEqual(mockFacebookMessage);
    });

    it('should delete Facebook message by id', async () => {
      mockExecFn.mockResolvedValueOnce(mockFacebookMessage);
      
      const result = await facebookMessageRepo.deleteById('test-fb-1');
      
      expect(result).toEqual(mockFacebookMessage);
    });
  });
});