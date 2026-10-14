export interface ChunkingOptions {
  chunkSize: number;
  overlap: number;
}

export class TextChunker {
  private options: ChunkingOptions;

  constructor(options: ChunkingOptions) {
    this.options = options;
  }

  /**
   * Split text into chunks with overlap
   * @param text Input text to chunk
   * @returns Array of text chunks
   */
  chunk(text: string): string[] {
    if (!text || text.trim().length === 0) {
      return [];
    }

    // If text is smaller than chunk size, return as single chunk
    if (text.length <= this.options.chunkSize) {
      return [text];
    }

    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      const end = Math.min(start + this.options.chunkSize, text.length);
      const chunk = text.substring(start, end);
      chunks.push(chunk);

      // Move start position by chunkSize minus overlap
      start = end - this.options.overlap;

      // If we're at the end and there's overlap, break to avoid infinite loop
      if (start >= text.length - this.options.overlap && end === text.length) {
        break;
      }
    }

    return chunks;
  }

  /**
   * Validate chunking parameters
   * @throws Error if parameters are invalid
   */
  validate(): void {
    if (this.options.chunkSize <= 0) {
      throw new Error('Chunk size must be positive');
    }

    if (this.options.overlap < 0) {
      throw new Error('Overlap cannot be negative');
    }

    if (this.options.overlap >= this.options.chunkSize) {
      throw new Error('Overlap must be less than chunk size');
    }
  }
}