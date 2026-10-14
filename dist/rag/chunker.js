"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextChunker = void 0;
class TextChunker {
    constructor(options) {
        this.options = options;
    }
    chunk(text) {
        if (!text || text.trim().length === 0) {
            return [];
        }
        if (text.length <= this.options.chunkSize) {
            return [text];
        }
        const chunks = [];
        let start = 0;
        while (start < text.length) {
            const end = Math.min(start + this.options.chunkSize, text.length);
            const chunk = text.substring(start, end);
            chunks.push(chunk);
            start = end - this.options.overlap;
            if (start >= text.length - this.options.overlap && end === text.length) {
                break;
            }
        }
        return chunks;
    }
    validate() {
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
exports.TextChunker = TextChunker;
//# sourceMappingURL=chunker.js.map