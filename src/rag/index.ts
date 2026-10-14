import { PrismaClient } from '@prisma/client';
import { RAGService, RAGServiceConfig } from './service';
import { OpenAIEmbedder } from './embedding';
import { PostgresVectorStore } from './vectorStore';

// Initialize the RAG service with dependencies
export function getRAGService(prismaClient: PrismaClient): RAGService {
  const embedder = new OpenAIEmbedder({
    apiKey: process.env.OPENAI_API_KEY || '',
    model: 'text-embedding-3-small',
    baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    dimensions: 1536,
  });
  
  const vectorStore = new PostgresVectorStore(prismaClient);
  
  const config: RAGServiceConfig = {
    chunkSize: 1000,
    overlap: 200,
    topK: 5,
  };
  
  return new RAGService(embedder, vectorStore, config, prismaClient);
}