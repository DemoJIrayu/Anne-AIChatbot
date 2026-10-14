"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RAGService = void 0;
const chunker_1 = require("./chunker");
class RAGService {
    constructor(embedder, vectorStore, config, prisma) {
        this.embedder = embedder;
        this.vectorStore = vectorStore;
        this.config = config;
        this.prisma = prisma;
        this.chunker = new chunker_1.TextChunker({
            chunkSize: config.chunkSize,
            overlap: config.overlap,
        });
        this.chunker.validate();
    }
    async ingestDocument(shopId, name, type, content) {
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
            let textContent = content;
            if (type === 'url') {
                textContent = `Content from URL: ${content}`;
            }
            const chunks = this.chunker.chunk(textContent);
            const embeddings = await this.embedder.embedBatch(chunks);
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
            await this.vectorStore.storeChunks(chunkData);
            await this.prisma.knowledgeSource.update({
                where: { id: knowledgeSource.id },
                data: { status: 'ready' },
            });
            return {
                knowledgeSourceId: knowledgeSource.id,
                chunkCount: chunks.length,
            };
        }
        catch (error) {
            await this.prisma.knowledgeSource.update({
                where: { id: knowledgeSource.id },
                data: { status: 'error' },
            });
            if (error instanceof Error) {
                throw error;
            }
            else {
                throw new Error('Unknown error during ingestion');
            }
        }
    }
    async retrieve(query, shopId) {
        const queryEmbedding = await this.embedder.embed(query);
        const results = await this.vectorStore.retrieve(queryEmbedding, this.config.topK, shopId);
        return results;
    }
    async deleteKnowledgeSource(knowledgeSourceId) {
        await this.vectorStore.deleteByKnowledgeSource(knowledgeSourceId);
        await this.prisma.knowledgeSource.delete({
            where: { id: knowledgeSourceId },
        });
    }
}
exports.RAGService = RAGService;
//# sourceMappingURL=service.js.map