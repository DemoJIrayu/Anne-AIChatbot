import { describe, it, expect } from 'vitest';
import { FakeEmbedder } from '../embedding';

describe('FakeEmbedder', () => {
  it('should generate consistent embeddings for the same text', async () => {
    const embedder = new FakeEmbedder();
    const text = 'Hello world';
    
    const embedding1 = await embedder.embed(text);
    const embedding2 = await embedder.embed(text);
    
    expect(embedding1).toEqual(embedding2);
    expect(embedding1.length).toBeGreaterThan(0);
  });

  it('should generate different embeddings for different texts', async () => {
    const embedder = new FakeEmbedder();
    const text1 = 'Hello world';
    const text2 = 'Goodbye world';
    
    const embedding1 = await embedder.embed(text1);
    const embedding2 = await embedder.embed(text2);
    
    expect(embedding1).not.toEqual(embedding2);
  });

  it('should handle batch embedding', async () => {
    const embedder = new FakeEmbedder();
    const texts = ['Hello', 'World', 'Test'];
    
    const embeddings = await embedder.embedBatch(texts);
    
    expect(embeddings.length).toBe(3);
    embeddings.forEach(embedding => {
      expect(embedding.length).toBeGreaterThan(0);
    });
  });

  it('should handle empty batch', async () => {
    const embedder = new FakeEmbedder();
    const embeddings = await embedder.embedBatch([]);
    
    expect(embeddings).toEqual([]);
  });
});