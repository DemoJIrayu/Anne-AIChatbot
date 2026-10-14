"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const service_1 = require("../service");
const embedding_1 = require("../embedding");
const mockPrisma = {
    knowledgeSource: {
        create: vitest_1.vi.fn(),
        update: vitest_1.vi.fn(),
        delete: vitest_1.vi.fn(),
    },
    $transaction: vitest_1.vi.fn(),
    $queryRaw: vitest_1.vi.fn(),
    $queryRawUnsafe: vitest_1.vi.fn(),
    $executeRaw: vitest_1.vi.fn(),
};
const mockVectorStore = {
    storeChunks: vitest_1.vi.fn(),
    retrieve: vitest_1.vi.fn(),
    deleteByKnowledgeSource: vitest_1.vi.fn(),
};
(0, vitest_1.describe)('RAGService', () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.it)('should initialize with valid configuration', () => {
        const embedder = new embedding_1.FakeEmbedder();
        const config = { chunkSize: 100, overlap: 20, topK: 5 };
        (0, vitest_1.expect)(() => {
            new service_1.RAGService(embedder, mockVectorStore, config, mockPrisma);
        }).not.toThrow();
    });
    (0, vitest_1.it)('should reject invalid chunking configuration', () => {
        const embedder = new embedding_1.FakeEmbedder();
        const config = { chunkSize: 10, overlap: 10, topK: 5 };
        (0, vitest_1.expect)(() => {
            new service_1.RAGService(embedder, mockVectorStore, config, mockPrisma);
        }).toThrow('Overlap must be less than chunk size');
    });
    (0, vitest_1.it)('should ingest document and return result', async () => {
        const embedder = new embedding_1.FakeEmbedder();
        const config = { chunkSize: 100, overlap: 20, topK: 5 };
        const service = new service_1.RAGService(embedder, mockVectorStore, config, mockPrisma);
        const knowledgeSourceId = 'ks-123';
        const shopId = 'shop-123';
        const name = 'Test Document';
        const content = 'This is test content for chunking.';
        mockPrisma.knowledgeSource.create = vitest_1.vi.fn().mockResolvedValue({
            id: knowledgeSourceId,
            shopId,
            name,
            type: 'text',
            source: content,
            status: 'processing',
        });
        mockPrisma.knowledgeSource.update = vitest_1.vi.fn().mockResolvedValue({});
        mockVectorStore.storeChunks = vitest_1.vi.fn().mockResolvedValue([]);
        const result = await service.ingestDocument(shopId, name, 'text', content);
        (0, vitest_1.expect)(result.knowledgeSourceId).toBe(knowledgeSourceId);
        (0, vitest_1.expect)(result.chunkCount).toBeGreaterThan(0);
        (0, vitest_1.expect)(mockPrisma.knowledgeSource.update).toHaveBeenCalledWith({
            where: { id: knowledgeSourceId },
            data: { status: 'ready' },
        });
    });
    (0, vitest_1.it)('should handle ingestion errors', async () => {
        const embedder = new embedding_1.FakeEmbedder();
        const config = { chunkSize: 100, overlap: 20, topK: 5 };
        const service = new service_1.RAGService(embedder, mockVectorStore, config, mockPrisma);
        const knowledgeSourceId = 'ks-123';
        const shopId = 'shop-123';
        const name = 'Test Document';
        const content = 'This is test content for chunking.';
        mockPrisma.knowledgeSource.create = vitest_1.vi.fn().mockResolvedValue({
            id: knowledgeSourceId,
        });
        vitest_1.vi.spyOn(embedder, 'embedBatch').mockRejectedValue(new Error('Embedding failed'));
        await (0, vitest_1.expect)(service.ingestDocument(shopId, name, 'text', content))
            .rejects.toThrow('Embedding failed');
        (0, vitest_1.expect)(mockPrisma.knowledgeSource.update).toHaveBeenCalledWith({
            where: { id: knowledgeSourceId },
            data: { status: 'error' },
        });
    });
    (0, vitest_1.it)('should retrieve relevant chunks', async () => {
        const embedder = new embedding_1.FakeEmbedder();
        const config = { chunkSize: 100, overlap: 20, topK: 5 };
        const service = new service_1.RAGService(embedder, mockVectorStore, config, mockPrisma);
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
        mockVectorStore.retrieve = vitest_1.vi.fn().mockResolvedValue(mockResults);
        const results = await service.retrieve(query);
        (0, vitest_1.expect)(results).toEqual(mockResults);
        (0, vitest_1.expect)(mockVectorStore.retrieve).toHaveBeenCalledWith(vitest_1.expect.any(Array), config.topK, undefined);
    });
});
//# sourceMappingURL=service.test.js.map