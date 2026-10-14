"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FakeEmbedder = exports.OpenAIEmbedder = void 0;
class OpenAIEmbedder {
    constructor(config) {
        this.config = config;
        this.baseUrl = config.baseUrl.endsWith('/v1') ? config.baseUrl : `${config.baseUrl}/v1`;
    }
    async embed(text) {
        const embeddings = await this.embedBatch([text]);
        return embeddings[0];
    }
    async embedBatch(texts) {
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
        const data = await response.json();
        return data.data.map(item => item.embedding);
    }
}
exports.OpenAIEmbedder = OpenAIEmbedder;
class FakeEmbedder {
    async embed(text) {
        const hash = Array.from(text).reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return Array(1536).fill(0).map((_, i) => Math.sin(hash + i) * 0.5);
    }
    async embedBatch(texts) {
        return Promise.all(texts.map(text => this.embed(text)));
    }
}
exports.FakeEmbedder = FakeEmbedder;
//# sourceMappingURL=embedding.js.map