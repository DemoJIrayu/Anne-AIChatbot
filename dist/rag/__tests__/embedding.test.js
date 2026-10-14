"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const embedding_1 = require("../embedding");
(0, vitest_1.describe)('FakeEmbedder', () => {
    (0, vitest_1.it)('should generate consistent embeddings for the same text', async () => {
        const embedder = new embedding_1.FakeEmbedder();
        const text = 'Hello world';
        const embedding1 = await embedder.embed(text);
        const embedding2 = await embedder.embed(text);
        (0, vitest_1.expect)(embedding1).toEqual(embedding2);
        (0, vitest_1.expect)(embedding1.length).toBeGreaterThan(0);
    });
    (0, vitest_1.it)('should generate different embeddings for different texts', async () => {
        const embedder = new embedding_1.FakeEmbedder();
        const text1 = 'Hello world';
        const text2 = 'Goodbye world';
        const embedding1 = await embedder.embed(text1);
        const embedding2 = await embedder.embed(text2);
        (0, vitest_1.expect)(embedding1).not.toEqual(embedding2);
    });
    (0, vitest_1.it)('should handle batch embedding', async () => {
        const embedder = new embedding_1.FakeEmbedder();
        const texts = ['Hello', 'World', 'Test'];
        const embeddings = await embedder.embedBatch(texts);
        (0, vitest_1.expect)(embeddings.length).toBe(3);
        embeddings.forEach(embedding => {
            (0, vitest_1.expect)(embedding.length).toBeGreaterThan(0);
        });
    });
    (0, vitest_1.it)('should handle empty batch', async () => {
        const embedder = new embedding_1.FakeEmbedder();
        const embeddings = await embedder.embedBatch([]);
        (0, vitest_1.expect)(embeddings).toEqual([]);
    });
});
//# sourceMappingURL=embedding.test.js.map