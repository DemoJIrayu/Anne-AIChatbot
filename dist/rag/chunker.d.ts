export interface ChunkingOptions {
    chunkSize: number;
    overlap: number;
}
export declare class TextChunker {
    private options;
    constructor(options: ChunkingOptions);
    chunk(text: string): string[];
    validate(): void;
}
//# sourceMappingURL=chunker.d.ts.map