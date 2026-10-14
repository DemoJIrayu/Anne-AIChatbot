"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRAGService = getRAGService;
const service_1 = require("./service");
const embedding_1 = require("./embedding");
const vectorStore_1 = require("./vectorStore");
function getRAGService(prismaClient) {
    const embedder = new embedding_1.OpenAIEmbedder({
        apiKey: process.env.OPENAI_API_KEY || '',
        model: 'text-embedding-3-small',
        baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
        dimensions: 1536,
    });
    const vectorStore = new vectorStore_1.PostgresVectorStore(prismaClient);
    const config = {
        chunkSize: 1000,
        overlap: 200,
        topK: 5,
    };
    return new service_1.RAGService(embedder, vectorStore, config, prismaClient);
}
//# sourceMappingURL=index.js.map