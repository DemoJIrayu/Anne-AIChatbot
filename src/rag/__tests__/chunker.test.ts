import { describe, it, expect } from 'vitest';
import { TextChunker } from '../chunker';

describe('TextChunker', () => {
  it('should chunk text with specified size and overlap', () => {
    const chunker = new TextChunker({ chunkSize: 10, overlap: 3 });
    const text = 'This is a sample text for chunking.';
    
    const chunks = chunker.chunk(text);
    
    expect(chunks.length).toBeGreaterThan(0);
    // Check that chunks don't exceed chunk size
    chunks.forEach(chunk => {
      expect(chunk.length).toBeLessThanOrEqual(10);
    });
    
    // Check that reassembled text matches original (approximately)
    const reassembled = chunks.join('');
    expect(reassembled.length).toBeGreaterThanOrEqual(text.length);
  });

  it('should handle empty input', () => {
    const chunker = new TextChunker({ chunkSize: 10, overlap: 3 });
    const chunks = chunker.chunk('');
    
    expect(chunks).toEqual([]);
  });

  it('should return single chunk for text smaller than chunk size', () => {
    const chunker = new TextChunker({ chunkSize: 50, overlap: 5 });
    const text = 'Short text';
    
    const chunks = chunker.chunk(text);
    
    expect(chunks).toEqual([text]);
  });

  it('should validate chunking parameters', () => {
    // Valid parameters
    const validChunker = new TextChunker({ chunkSize: 10, overlap: 3 });
    expect(() => validChunker.validate()).not.toThrow();
    
    // Invalid: chunk size zero
    const zeroChunker = new TextChunker({ chunkSize: 0, overlap: 3 });
    expect(() => zeroChunker.validate()).toThrow('Chunk size must be positive');
    
    // Invalid: negative overlap
    const negativeOverlapChunker = new TextChunker({ chunkSize: 10, overlap: -1 });
    expect(() => negativeOverlapChunker.validate()).toThrow('Overlap cannot be negative');
    
    // Invalid: overlap >= chunk size
    const largeOverlapChunker = new TextChunker({ chunkSize: 10, overlap: 10 });
    expect(() => largeOverlapChunker.validate()).toThrow('Overlap must be less than chunk size');
  });
});