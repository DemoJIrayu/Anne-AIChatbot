"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const webhook_1 = require("../line/webhook");
const repositories_1 = require("../../db/postgres/repositories");
const repositories_2 = require("../../db/mongodb/repositories");
const createMockRequest = (params = {}) => ({
    query: params.query || {},
    body: params.body || {},
    get: vitest_1.vi.fn((header) => params.headers?.[header.toLowerCase()]),
    ...params
});
const createMockResponse = () => {
    const res = {};
    res.status = vitest_1.vi.fn(() => res);
    res.send = vitest_1.vi.fn(() => res);
    res.sendStatus = vitest_1.vi.fn(() => res);
    res.json = vitest_1.vi.fn(() => res);
    return res;
};
vitest_1.vi.mock('../../db/postgres/repositories', () => ({
    shopRepository: {
        findAll: vitest_1.vi.fn()
    },
    settingRepository: {
        findByShopId: vitest_1.vi.fn()
    }
}));
vitest_1.vi.mock('../../db/mongodb/repositories', () => ({
    lineMessageRepository: {
        create: vitest_1.vi.fn(),
        updateReply: vitest_1.vi.fn()
    }
}));
vitest_1.vi.mock('../../utils/logger', () => ({
    default: {
        info: vitest_1.vi.fn(),
        warn: vitest_1.vi.fn(),
        error: vitest_1.vi.fn()
    }
}));
const mockRAGService = {
    retrieve: vitest_1.vi.fn()
};
vitest_1.vi.mock('../../rag', () => ({
    getRAGService: vitest_1.vi.fn(() => mockRAGService)
}));
(0, vitest_1.describe)('LINE Webhook', () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        const mockPrismaClient = {};
        (0, webhook_1.initializeLineIntegration)(mockPrismaClient);
    });
    (0, vitest_1.describe)('verifySignature', () => {
        (0, vitest_1.it)('should reject request with missing signature', () => {
            const req = createMockRequest();
            const res = createMockResponse();
            const next = vitest_1.vi.fn();
            (0, webhook_1.verifySignature)(req, res, next);
            (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(400);
            (0, vitest_1.expect)(res.send).toHaveBeenCalledWith('Missing signature');
        });
        (0, vitest_1.it)('should reject request with invalid signature', () => {
            process.env.LINE_CHANNEL_SECRET = 'test_secret';
            const req = createMockRequest({
                headers: {
                    'x-line-signature': 'invalid_signature'
                },
                body: {}
            });
            const res = createMockResponse();
            const next = vitest_1.vi.fn();
            (0, webhook_1.verifySignature)(req, res, next);
            (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(403);
            (0, vitest_1.expect)(res.send).toHaveBeenCalledWith('Invalid signature');
        });
    });
    (0, vitest_1.describe)('handleWebhook', () => {
        (0, vitest_1.it)('should process valid message event and generate reply', async () => {
            repositories_1.shopRepository.findAll.mockResolvedValue([{
                    id: 'shop-123',
                    settings: [{
                            lineChannelId: 'user-123'
                        }]
                }]);
            repositories_1.settingRepository.findByShopId.mockResolvedValue({
                autoReply: true,
                confidenceThreshold: 0.7
            });
            mockRAGService.retrieve.mockResolvedValue([{
                    chunk: {
                        content: 'Test knowledge content'
                    },
                    similarity: 0.95
                }]);
            repositories_2.lineMessageRepository.create.mockResolvedValue({
                messageId: 'msg-123'
            });
            const req = createMockRequest({
                body: {
                    events: [{
                            type: 'message',
                            source: {
                                userId: 'user-123'
                            },
                            replyToken: 'reply-token-123',
                            timestamp: Date.now(),
                            message: {
                                id: 'msg-123',
                                type: 'text',
                                text: 'Hello, how can you help me?'
                            }
                        }]
                }
            });
            const res = createMockResponse();
            await (0, webhook_1.handleWebhook)(req, res);
            (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(200);
            (0, vitest_1.expect)(res.send).toHaveBeenCalledWith({ status: 'ok' });
            (0, vitest_1.expect)(repositories_2.lineMessageRepository.create).toHaveBeenCalled();
            (0, vitest_1.expect)(mockRAGService.retrieve).toHaveBeenCalled();
            (0, vitest_1.expect)(repositories_2.lineMessageRepository.updateReply).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should not generate reply when auto-reply is disabled', async () => {
            repositories_1.shopRepository.findAll.mockResolvedValue([{
                    id: 'shop-123',
                    settings: [{
                            lineChannelId: 'user-123'
                        }]
                }]);
            repositories_1.settingRepository.findByShopId.mockResolvedValue({
                autoReply: false
            });
            repositories_2.lineMessageRepository.create.mockResolvedValue({
                messageId: 'msg-123'
            });
            const req = createMockRequest({
                body: {
                    events: [{
                            type: 'message',
                            source: {
                                userId: 'user-123'
                            },
                            replyToken: 'reply-token-123',
                            timestamp: Date.now(),
                            message: {
                                id: 'msg-123',
                                type: 'text',
                                text: 'Hello, how can you help me?'
                            }
                        }]
                }
            });
            const res = createMockResponse();
            await (0, webhook_1.handleWebhook)(req, res);
            (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(200);
            (0, vitest_1.expect)(res.send).toHaveBeenCalledWith({ status: 'ok' });
            (0, vitest_1.expect)(repositories_2.lineMessageRepository.create).toHaveBeenCalled();
            (0, vitest_1.expect)(mockRAGService.retrieve).not.toHaveBeenCalled();
            (0, vitest_1.expect)(repositories_2.lineMessageRepository.updateReply).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should use fallback message when confidence threshold is not met', async () => {
            repositories_1.shopRepository.findAll.mockResolvedValue([{
                    id: 'shop-123',
                    settings: [{
                            lineChannelId: 'user-123'
                        }]
                }]);
            repositories_1.settingRepository.findByShopId.mockResolvedValue({
                autoReply: true,
                confidenceThreshold: 0.8,
                fallbackMessage: 'I cannot help with that specific question.'
            });
            mockRAGService.retrieve.mockResolvedValue([{
                    chunk: {
                        content: 'Low confidence content'
                    },
                    similarity: 0.3
                }]);
            repositories_2.lineMessageRepository.create.mockResolvedValue({
                messageId: 'msg-123'
            });
            const req = createMockRequest({
                body: {
                    events: [{
                            type: 'message',
                            source: {
                                userId: 'user-123'
                            },
                            replyToken: 'reply-token-123',
                            timestamp: Date.now(),
                            message: {
                                id: 'msg-123',
                                type: 'text',
                                text: 'Hello, how can you help me?'
                            }
                        }]
                }
            });
            const res = createMockResponse();
            await (0, webhook_1.handleWebhook)(req, res);
            (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(200);
            (0, vitest_1.expect)(res.send).toHaveBeenCalledWith({ status: 'ok' });
            (0, vitest_1.expect)(repositories_2.lineMessageRepository.create).toHaveBeenCalled();
            (0, vitest_1.expect)(mockRAGService.retrieve).toHaveBeenCalled();
            (0, vitest_1.expect)(repositories_2.lineMessageRepository.updateReply).toHaveBeenCalledWith('msg-123', 'I cannot help with that specific question.');
        });
        (0, vitest_1.it)('should handle webhook errors gracefully and still return success', async () => {
            repositories_1.shopRepository.findAll.mockRejectedValue(new Error('Database error'));
            const req = createMockRequest({
                body: {
                    events: []
                }
            });
            const res = createMockResponse();
            await (0, webhook_1.handleWebhook)(req, res);
            (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(200);
            (0, vitest_1.expect)(res.send).toHaveBeenCalledWith({ status: 'ok' });
        });
    });
});
//# sourceMappingURL=line-webhook.test.js.map