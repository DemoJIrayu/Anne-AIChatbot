import { EmbeddingConfig } from './types';

export interface Embedder {
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
}

interface OpenAIEmbeddingResponse {
  data: Array<{ embedding: number[] }>;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

export class OpenAIEmbedder implements Embedder {
  private config: EmbeddingConfig;
  private baseUrl: string;

  constructor(config: EmbeddingConfig) {
    this.config = config;
    // Ensure baseUrl ends with /v1 for OpenAI compatibility
    this.baseUrl = config.baseUrl.endsWith('/v1') ? config.baseUrl : `${config.baseUrl}/v1`;
  }

  async embed(text: string): Promise<number[]> {
    const embeddings = await this.embedBatch([text]);
    return embeddings[0];
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }

    const response = await fetch(`${this.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: texts,
        model: this.config.model,
        encoding_format: 'float',
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate embeddings: ${response.statusText}`);
    }

    const data = await response.json() as OpenAIEmbeddingResponse;
    return data.data.map(item => item.embedding);
  }
}

// Fake embedder for testing
export class FakeEmbedder implements Embedder {
  async embed(text: string): Promise<number[]> {
    // Simple deterministic fake embedding based on text length and content
    const hash = Array.from(text).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return Array(1536).fill(0).map((_, i) => Math.sin(hash + i) * 0.5);
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map(text => this.embed(text)));
  }
}