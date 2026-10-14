import { DocumentChunk, RetrievalResult } from './types';
import { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';

export interface VectorStore {
  storeChunks(chunks: Omit<DocumentChunk, 'id' | 'createdAt'>[]): Promise<DocumentChunk[]>;
  retrieve(queryEmbedding: number[], topK: number, shopId?: string): Promise<RetrievalResult[]>;
  deleteByKnowledgeSource(knowledgeSourceId: string): Promise<void>;
}

interface RawRetrievalResult {
  id: string;
  knowledgeSourceId: string;
  content: string;
  embedding: string;
  metadata: string;
  createdAt: string;
  similarity: number;
}

interface RawStoredChunk {
  id: string;
  knowledgeSourceId: string;
  content: string;
  embedding: string;
  metadata: string;
  createdAt: string;
}

export class PostgresVectorStore implements VectorStore {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async storeChunks(chunks: Omit<DocumentChunk, 'id' | 'createdAt'>[]): Promise<DocumentChunk[]> {
    if (chunks.length === 0) {
      return [];
    }

    // Convert embeddings to JSON strings for storage
    const chunkRecords = chunks.map(chunk => ({
      knowledgeSourceId: chunk.knowledgeSourceId,
      content: chunk.content,
      embedding: JSON.stringify(chunk.embedding),
      metadata: JSON.stringify(chunk.metadata),
    }));

    const storedChunks = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const results: RawStoredChunk[] = [];
      for (const record of chunkRecords) {
        const stored = await tx.$queryRaw<RawStoredChunk[]>`
          INSERT INTO document_chunks (
            id, 
            knowledge_source_id, 
            content, 
            embedding, 
            metadata, 
            created_at
          ) VALUES (
            gen_random_uuid(),
            ${record.knowledgeSourceId},
            ${record.content},
            ${record.embedding}::double precision[],
            ${record.metadata}::jsonb,
            NOW()
          )
          RETURNING 
            id,
            knowledge_source_id as "knowledgeSourceId",
            content,
            embedding,
            metadata,
            created_at as "createdAt"
        `;
        results.push(stored[0]);
      }
      return results;
    });

    return storedChunks.map(chunk => ({
      ...chunk,
      embedding: JSON.parse(chunk.embedding),
      metadata: JSON.parse(chunk.metadata),
      createdAt: new Date(chunk.createdAt),
    }));
  }

  async retrieve(queryEmbedding: number[], topK: number, shopId?: string): Promise<RetrievalResult[]> {
    let query;
    if (shopId) {
      query = `
        SELECT 
          dc.id,
          dc.knowledge_source_id as "knowledgeSourceId",
          dc.content,
          dc.embedding,
          dc.metadata,
          dc.created_at as "createdAt",
          (SELECT 1 - (SUM(a*b) / (SQRT(SUM(a*a)) * SQRT(SUM(b*b)))))
           FROM unnest(dc.embedding, $3::double precision[]) AS t(a,b)
          ) as similarity
        FROM document_chunks dc
        JOIN knowledge_sources ks ON dc.knowledge_source_id = ks.id
        WHERE ks.shop_id = $1
        ORDER BY similarity DESC
        LIMIT $2
      `;
    } else {
      query = `
        SELECT 
          id,
          knowledge_source_id as "knowledgeSourceId",
          content,
          embedding,
          metadata,
          created_at as "createdAt",
          (SELECT 1 - (SUM(a*b) / (SQRT(SUM(a*a)) * SQRT(SUM(b*b)))))
           FROM unnest(embedding, $2::double precision[]) AS t(a,b)
          ) as similarity
        FROM document_chunks
        ORDER BY similarity DESC
        LIMIT $1
      `;
    }

    const results = await this.prisma.$queryRawUnsafe(
      query,
      ...(shopId ? [shopId, topK, queryEmbedding] : [topK, queryEmbedding])
    ) as RawRetrievalResult[];

    return results.map((row: RawRetrievalResult) => ({
      chunk: {
        id: row.id,
        knowledgeSourceId: row.knowledgeSourceId,
        content: row.content,
        embedding: JSON.parse(row.embedding),
        metadata: JSON.parse(row.metadata),
        createdAt: new Date(row.createdAt),
      },
      similarity: parseFloat(row.similarity.toFixed(4)),
    }));
  }

  async deleteByKnowledgeSource(knowledgeSourceId: string): Promise<void> {
    await this.prisma.$executeRaw`
      DELETE FROM document_chunks 
      WHERE knowledge_source_id = ${knowledgeSourceId}
    `;
  }
}