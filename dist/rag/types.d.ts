export interface EmbeddingConfig {
    model: string;
    dimensions: number;
    baseUrl: string;
    apiKey: string;
}
export interface DocumentChunk {
    id: string;
    knowledgeSourceId: string;
    content: string;
    embedding: number[];
    metadata: Record<string, unknown>;
    createdAt: Date;
}
export interface KnowledgeSource {
    id: string;
    shopId: string;
    name: string;
    type: 'text' | 'url';
    source: string;
    status: 'pending' | 'processing' | 'ready' | 'error';
    createdAt: Date;
    updatedAt: Date;
}
export interface IngestionResult {
    knowledgeSourceId: string;
    chunkCount: number;
}
export interface RetrievalResult {
    chunk: DocumentChunk;
    similarity: number;
}
//# sourceMappingURL=types.d.ts.map