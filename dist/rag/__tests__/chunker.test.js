"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const chunker_1 = require("../chunker");
(0, vitest_1.describe)('TextChunker', () => {
    (0, vitest_1.it)('should chunk text with specified size and overlap', () => {
        const chunker = new chunker_1.TextChunker({ chunkSize: 10, overlap: 3 });
        const text = 'This is a sample text for chunking.';
        const chunks = chunker.chunk(text);
        (0, vitest_1.expect)(chunks.length).toBeGreaterThan(0);
        chunks.forEach(chunk => {
            (0, vitest_1.expect)(chunk.length).toBeLessThanOrEqual(10);
        });
        const reassembled = chunks.join('');
        (0, vitest_1.expect)(reassembled.length).toBeGreaterThanOrEqual(text.length);
    });
    (0, vitest_1.it)('should handle empty input', () => {
        const chunker = new chunker_1.TextChunker({ chunkSize: 10, overlap: 3 });
        const chunks = chunker.chunk('');
        (0, vitest_1.expect)(chunks).toEqual([]);
    });
    (0, vitest_1.it)('should return single chunk for text smaller than chunk size', () => {
        const chunker = new chunker_1.TextChunker({ chunkSize: 50, overlap: 5 });
        const text = 'Short text';
        const chunks = chunker.chunk(text);
        (0, vitest_1.expect)(chunks).toEqual([text]);
    });
    (0, vitest_1.it)('should validate chunking parameters', () => {
        const validChunker = new chunker_1.TextChunker({ chunkSize: 10, overlap: 3 });
        (0, vitest_1.expect)(() => validChunker.validate()).not.toThrow();
        const zeroChunker = new chunker_1.TextChunker({ chunkSize: 0, overlap: 3 });
        (0, vitest_1.expect)(() => zeroChunker.validate()).toThrow('Chunk size must be positive');
        const negativeOverlapChunker = new chunker_1.TextChunker({ chunkSize: 10, overlap: -1 });
        (0, vitest_1.expect)(() => negativeOverlapChunker.validate()).toThrow('Overlap cannot be negative');
        const largeOverlapChunker = new chunker_1.TextChunker({ chunkSize: 10, overlap: 10 });
        (0, vitest_1.expect)(() => largeOverlapChunker.validate()).toThrow('Overlap must be less than chunk size');
    });
});
//# sourceMappingURL=chunker.test.js.map