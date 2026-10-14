import { Embedder } from './embedding';
import { TextChunker } from './chunker';
import { VectorStore } from './vectorStore';
import { IngestionResult, RetrievalResult } from './types';
import { PrismaClient } from '@prisma/client';

export interface RAGServiceConfig {
  chunkSize: number;
  overlap: number;
  topK: number;
}

export class RAGService {
  private embedder: Embedder;
  private chunker: TextChunker;
  private vectorStore: VectorStore;
  private config: RAGServiceConfig;
  private prisma: PrismaClient;

  constructor(
    embedder: Embedder,
    vectorStore: VectorStore,
    config: RAGServiceConfig,
    prisma: PrismaClient
  ) {
    this.embedder = embedder;
    this.vectorStore = vectorStore;
    this.config = config;
    this.prisma = prisma;
    
    this.chunker = new TextChunker({
      chunkSize: config.chunkSize,
      overlap: config.overlap,
    });
    
    // Validate chunking parameters
    this.chunker.validate();
  }

  /**
   * Ingest a document (text or URL content) and store its embeddings
   * @param shopId ID of the shop owning this knowledge source
   * @param name Name/description of the knowledge source
   * @param type Type of the source ('text' or 'url')
   * @param content Text content or URL to ingest
   * @returns Ingestion result with knowledge source ID and chunk count
   */
  async ingestDocument(
    shopId: string,
    name: string,
    type: 'text' | 'url',
    content: string
  ): Promise<IngestionResult> {
    // Create knowledge source record
    const knowledgeSource = await this.prisma.knowledgeSource.create({
      data: {
        shopId,
        name,
        type,
        source: content,
        status: 'processing',
      },
    });

    try {
      // For URL type, we would normally fetch content here
      // For this implementation, we'll treat content as the actual text
      let textContent = content;
      if (type === 'url') {
        // In a full implementation, we would fetch the URL content
        // For now, we'll just use the URL as text for demonstration
        textContent = `Content from URL: ${content}`;
      }

      // Chunk the text
      const chunks = this.chunker.chunk(textContent);

      // Generate embeddings for all chunks
      const embeddings = await this.embedder.embedBatch(chunks);

      // Prepare chunks with metadata
      const chunkData = chunks.map((chunk, index) => ({
        knowledgeSourceId: knowledgeSource.id,
        content: chunk,
        embedding: embeddings[index],
        metadata: {
          chunkIndex: index,
          totalChunks: chunks.length,
          sourceType: type,
          sourceName: name,
        },
      }));

      // Store chunks in vector store
      await this.vectorStore.storeChunks(chunkData);

      // Update knowledge source status to ready
      await this.prisma.knowledgeSource.update({
        where: { id: knowledgeSource.id },
        data: { status: 'ready' },
      });

      return {
        knowledgeSourceId: knowledgeSource.id,
        chunkCount: chunks.length,
      };
    } catch (error: unknown) {
      // Update knowledge source status to error
      await this.prisma.knowledgeSource.update({
        where: { id: knowledgeSource.id },
        data: { status: 'error' },
      });
      
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error('Unknown error during ingestion');
      }
    }
  }

  /**
   * Retrieve relevant chunks for a query
   * @param query Query text
   * @param shopId Optional shop ID to filter results
   * @returns Top-k most relevant chunks with similarity scores
   */
  async retrieve(query: string, shopId?: string): Promise<RetrievalResult[]> {
    // Generate embedding for the query
    const queryEmbedding = await this.embedder.embed(query);
    
    // Retrieve top-k similar chunks
    const results = await this.vectorStore.retrieve(
      queryEmbedding,
      this.config.topK,
      shopId
    );
    
    return results;
  }

  /**
   * Delete all chunks associated with a knowledge source
   * @param knowledgeSourceId ID of the knowledge source to delete
   */
  async deleteKnowledgeSource(knowledgeSourceId: string): Promise<void> {
    await this.vectorStore.deleteByKnowledgeSource(knowledgeSourceId);
    await this.prisma.knowledgeSource.delete({
      where: { id: knowledgeSourceId },
    });
  }
}