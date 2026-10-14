import { describe, it, expect, beforeEach, vi } from 'vitest';
import { verifySignature, handleWebhook, initializeLineIntegration } from '../line/webhook';
import { shopRepository, settingRepository } from '../../db/postgres/repositories';
import { lineMessageRepository } from '../../db/mongodb/repositories';

// Mock Express request and response objects
const createMockRequest = (params: any = {}) => ({
  query: params.query || {},
  body: params.body || {},
  get: vi.fn((header) => params.headers?.[header.toLowerCase()]),
  ...params
});

const createMockResponse = () => {
  const res: any = {};
  res.status = vi.fn(() => res);
  res.send = vi.fn(() => res);
  res.sendStatus = vi.fn(() => res);
  res.json = vi.fn(() => res);
  return res;
};

// Mock repositories and services
vi.mock('../../db/postgres/repositories', () => ({
  shopRepository: {
    findAll: vi.fn()
  },
  settingRepository: {
    findByShopId: vi.fn()
  }
}));

vi.mock('../../db/mongodb/repositories', () => ({
  lineMessageRepository: {
    create: vi.fn(),
    updateReply: vi.fn()
  }
}));

// Mock logger
vi.mock('../../utils/logger', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

// Mock the RAG service getter
const mockRAGService = {
  retrieve: vi.fn()
};

vi.mock('../../rag', () => ({
  getRAGService: vi.fn(() => mockRAGService)
}));

describe('LINE Webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Initialize the integration with a mock Prisma client
    const mockPrismaClient = {
      // Mock Prisma client methods as needed
    };
    
    // Call the initialization function
    initializeLineIntegration(mockPrismaClient as any);
  });

  describe('verifySignature', () => {
    it('should reject request with missing signature', () => {
      const req = createMockRequest();
      const res: any = createMockResponse();
      const next = vi.fn();
      
      verifySignature(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith('Missing signature');
    });

    it('should reject request with invalid signature', () => {
      process.env.LINE_CHANNEL_SECRET = 'test_secret';
      
      const req = createMockRequest({
        headers: {
          'x-line-signature': 'invalid_signature'
        },
        body: {}
      });
      const res: any = createMockResponse();
      const next = vi.fn();
      
      verifySignature(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.send).toHaveBeenCalledWith('Invalid signature');
    });
  });

  describe('handleWebhook', () => {
    it('should process valid message event and generate reply', async () => {
      // Mock shop repository
      (shopRepository.findAll as any).mockResolvedValue([{
        id: 'shop-123',
        settings: [{
          lineChannelId: 'user-123'
        }]
      }]);
      
      // Mock settings repository to enable auto-reply
      (settingRepository.findByShopId as any).mockResolvedValue({
        autoReply: true,
        confidenceThreshold: 0.7
      });
      
      // Mock RAG service
      (mockRAGService.retrieve as any).mockResolvedValue([{
        chunk: {
          content: 'Test knowledge content'
        },
        similarity: 0.95
      }]);
      
      // Mock message repository
      (lineMessageRepository.create as any).mockResolvedValue({
        messageId: 'msg-123'
      });
      
      const req = createMockRequest({
        body: {
          events: [{
            type: 'message',
            source: {
              userId: 'user-123'
            },
            replyToken: 'reply-token-123',
            timestamp: Date.now(),
            message: {
              id: 'msg-123',
              type: 'text',
              text: 'Hello, how can you help me?'
            }
          }]
        }
      });
      const res: any = createMockResponse();
      
      await handleWebhook(req, res);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({ status: 'ok' });
      expect(lineMessageRepository.create).toHaveBeenCalled();
      expect(mockRAGService.retrieve).toHaveBeenCalled();
      expect(lineMessageRepository.updateReply).toHaveBeenCalled();
    });

    it('should not generate reply when auto-reply is disabled', async () => {
      // Mock shop repository
      (shopRepository.findAll as any).mockResolvedValue([{
        id: 'shop-123',
        settings: [{
          lineChannelId: 'user-123'
        }]
      }]);
      
      // Mock settings repository to disable auto-reply
      (settingRepository.findByShopId as any).mockResolvedValue({
        autoReply: false
      });
      
      // Mock message repository
      (lineMessageRepository.create as any).mockResolvedValue({
        messageId: 'msg-123'
      });
      
      const req = createMockRequest({
        body: {
          events: [{
            type: 'message',
            source: {
              userId: 'user-123'
            },
            replyToken: 'reply-token-123',
            timestamp: Date.now(),
            message: {
              id: 'msg-123',
              type: 'text',
              text: 'Hello, how can you help me?'
            }
          }]
        }
      });
      const res: any = createMockResponse();
      
      await handleWebhook(req, res);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({ status: 'ok' });
      expect(lineMessageRepository.create).toHaveBeenCalled();
      // Should not call RAG service or update reply when auto-reply is disabled
      expect(mockRAGService.retrieve).not.toHaveBeenCalled();
      expect(lineMessageRepository.updateReply).not.toHaveBeenCalled();
    });

    it('should use fallback message when confidence threshold is not met', async () => {
      // Mock shop repository
      (shopRepository.findAll as any).mockResolvedValue([{
        id: 'shop-123',
        settings: [{
          lineChannelId: 'user-123'
        }]
      }]);
      
      // Mock settings repository with auto-reply enabled and confidence threshold
      (settingRepository.findByShopId as any).mockResolvedValue({
        autoReply: true,
        confidenceThreshold: 0.8,
        fallbackMessage: 'I cannot help with that specific question.'
      });
      
      // Mock RAG service with low confidence result
      (mockRAGService.retrieve as any).mockResolvedValue([{
        chunk: {
          content: 'Low confidence content'
        },
        similarity: 0.3
      }]);
      
      // Mock message repository
      (lineMessageRepository.create as any).mockResolvedValue({
        messageId: 'msg-123'
      });
      
      const req = createMockRequest({
        body: {
          events: [{
            type: 'message',
            source: {
              userId: 'user-123'
            },
            replyToken: 'reply-token-123',
            timestamp: Date.now(),
            message: {
              id: 'msg-123',
              type: 'text',
              text: 'Hello, how can you help me?'
            }
          }]
        }
      });
      const res: any = createMockResponse();
      
      await handleWebhook(req, res);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({ status: 'ok' });
      expect(lineMessageRepository.create).toHaveBeenCalled();
      expect(mockRAGService.retrieve).toHaveBeenCalled();
      // Should update reply with fallback message
      expect(lineMessageRepository.updateReply).toHaveBeenCalledWith('msg-123', 'I cannot help with that specific question.');
    });

    it('should handle webhook errors gracefully and still return success', async () => {
      (shopRepository.findAll as any).mockRejectedValue(new Error('Database error'));
      
      const req = createMockRequest({
        body: {
          events: []
        }
      });
      const res: any = createMockResponse();
      
      await handleWebhook(req, res);
      
      // Even with internal errors, webhooks should return success to prevent retries
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({ status: 'ok' });
    });
  });
});