import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RAGService } from '../service';
import { FakeEmbedder } from '../embedding';
import { TextChunker } from '../chunker';
import { PostgresVectorStore } from '../vectorStore';
import { PrismaClient } from '@prisma/client';

// Mock Prisma client
const mockPrisma = {
  knowledgeSource: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  $transaction: vi.fn(),
  $queryRaw: vi.fn(),
  $queryRawUnsafe: vi.fn(),
  $executeRaw: vi.fn(),
} as unknown as PrismaClient;

// Mock vector store
const mockVectorStore = {
  storeChunks: vi.fn(),
  retrieve: vi.fn(),
  deleteByKnowledgeSource: vi.fn(),
};

describe('RAGService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with valid configuration', () => {
    const embedder = new FakeEmbedder();
    const config = { chunkSize: 100, overlap: 20, topK: 5 };
    
    expect(() => {
      new RAGService(embedder, mockVectorStore, config, mockPrisma);
    }).not.toThrow();
  });

  it('should reject invalid chunking configuration', () => {
    const embedder = new FakeEmbedder();
    const config = { chunkSize: 10, overlap: 10, topK: 5 }; // overlap == chunkSize is invalid
    
    expect(() => {
      new RAGService(embedder, mockVectorStore, config, mockPrisma);
    }).toThrow('Overlap must be less than chunk size');
  });

  it('should ingest document and return result', async () => {
    const embedder = new FakeEmbedder();
    const config = { chunkSize: 100, overlap: 20, topK: 5 };
    const service = new RAGService(embedder, mockVectorStore, config, mockPrisma);
    
    const knowledgeSourceId = 'ks-123';
    const shopId = 'shop-123';
    const name = 'Test Document';
    const content = 'This is test content for chunking.';
    
    // Mock knowledge source creation
    mockPrisma.knowledgeSource.create = vi.fn().mockResolvedValue({
      id: knowledgeSourceId,
      shopId,
      name,
      type: 'text',
      source: content,
      status: 'processing',
    });
    
    // Mock successful processing
    mockPrisma.knowledgeSource.update = vi.fn().mockResolvedValue({});
    
    // Mock vector store
    mockVectorStore.storeChunks = vi.fn().mockResolvedValue([]);
    
    const result = await service.ingestDocument(shopId, name, 'text', content);
    
    expect(result.knowledgeSourceId).toBe(knowledgeSourceId);
    expect(result.chunkCount).toBeGreaterThan(0);
    
    // Verify knowledge source was updated to 'ready'
    expect(mockPrisma.knowledgeSource.update).toHaveBeenCalledWith({
      where: { id: knowledgeSourceId },
      data: { status: 'ready' },
    });
  });

  it('should handle ingestion errors', async () => {
    const embedder = new FakeEmbedder();
    const config = { chunkSize: 100, overlap: 20, topK: 5 };
    const service = new RAGService(embedder, mockVectorStore, config, mockPrisma);
    
    const knowledgeSourceId = 'ks-123';
    const shopId = 'shop-123';
    const name = 'Test Document';
    const content = 'This is test content for chunking.';
    
    // Mock knowledge source creation
    mockPrisma.knowledgeSource.create = vi.fn().mockResolvedValue({
      id: knowledgeSourceId,
    });
    
    // Mock embedding failure
    vi.spyOn(embedder, 'embedBatch').mockRejectedValue(new Error('Embedding failed'));
    
    await expect(service.ingestDocument(shopId, name, 'text', content))
      .rejects.toThrow('Embedding failed');
    
    // Verify knowledge source was updated to 'error'
    expect(mockPrisma.knowledgeSource.update).toHaveBeenCalledWith({
      where: { id: knowledgeSourceId },
      data: { status: 'error' },
    });
  });

  it('should retrieve relevant chunks', async () => {
    const embedder = new FakeEmbedder();
    const config = { chunkSize: 100, overlap: 20, topK: 5 };
    const service = new RAGService(embedder, mockVectorStore, config, mockPrisma);
    
    const query = 'test query';
    const mockResults = [
      {
        chunk: {
          id: 'chunk-1',
          knowledgeSourceId: 'ks-123',
          content: 'relevant content',
          embedding: [0.1, 0.2, 0.3],
          metadata: {},
          createdAt: new Date(),
        },
        similarity: 0.95,
      }
    ];
    
    mockVectorStore.retrieve = vi.fn().mockResolvedValue(mockResults);
    
    const results = await service.retrieve(query);
    
    expect(results).toEqual(mockResults);
    expect(mockVectorStore.retrieve).toHaveBeenCalledWith(
      expect.any(Array), // embedding array
      config.topK,
      undefined
    );
  });
});