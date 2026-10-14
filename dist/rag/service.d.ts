import { Embedder } from './embedding';
import { VectorStore } from './vectorStore';
import { IngestionResult, RetrievalResult } from './types';
import { PrismaClient } from '@prisma/client';
export interface RAGServiceConfig {
    chunkSize: number;
    overlap: number;
    topK: number;
}
export declare class RAGService {
    private embedder;
    private chunker;
    private vectorStore;
    private config;
    private prisma;
    constructor(embedder: Embedder, vectorStore: VectorStore, config: RAGServiceConfig, prisma: PrismaClient);
    ingestDocument(shopId: string, name: string, type: 'text' | 'url', content: string): Promise<IngestionResult>;
    retrieve(query: string, shopId?: string): Promise<RetrievalResult[]>;
    deleteKnowledgeSource(knowledgeSourceId: string): Promise<void>;
}
//# sourceMappingURL=service.d.ts.map