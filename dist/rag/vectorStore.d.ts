import { DocumentChunk, RetrievalResult } from './types';
import { PrismaClient } from '@prisma/client';
export interface VectorStore {
    storeChunks(chunks: Omit<DocumentChunk, 'id' | 'createdAt'>[]): Promise<DocumentChunk[]>;
    retrieve(queryEmbedding: number[], topK: number, shopId?: string): Promise<RetrievalResult[]>;
    deleteByKnowledgeSource(knowledgeSourceId: string): Promise<void>;
}
export declare class PostgresVectorStore implements VectorStore {
    private prisma;
    constructor(prisma: PrismaClient);
    storeChunks(chunks: Omit<DocumentChunk, 'id' | 'createdAt'>[]): Promise<DocumentChunk[]>;
    retrieve(queryEmbedding: number[], topK: number, shopId?: string): Promise<RetrievalResult[]>;
    deleteByKnowledgeSource(knowledgeSourceId: string): Promise<void>;
}
//# sourceMappingURL=vectorStore.d.ts.map