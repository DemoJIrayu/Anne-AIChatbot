import { EmbeddingConfig } from './types';
export interface Embedder {
    embed(text: string): Promise<number[]>;
    embedBatch(texts: string[]): Promise<number[][]>;
}
export declare class OpenAIEmbedder implements Embedder {
    private config;
    private baseUrl;
    constructor(config: EmbeddingConfig);
    embed(text: string): Promise<number[]>;
    embedBatch(texts: string[]): Promise<number[][]>;
}
export declare class FakeEmbedder implements Embedder {
    embed(text: string): Promise<number[]>;
    embedBatch(texts: string[]): Promise<number[][]>;
}
//# sourceMappingURL=embedding.d.ts.map