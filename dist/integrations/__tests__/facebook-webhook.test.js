"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const webhook_1 = require("../facebook/webhook");
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
    facebookMessageRepository: {
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
(0, vitest_1.describe)('Facebook Webhook', () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        process.env.FACEBOOK_VERIFY_TOKEN = 'test_verify_token';
        const mockPrismaClient = {};
        (0, webhook_1.initializeFacebookIntegration)(mockPrismaClient);
    });
    (0, vitest_1.describe)('verifyWebhook', () => {
        (0, vitest_1.it)('should respond with challenge for valid verification', () => {
            const challenge = '123456789';
            const req = createMockRequest({
                query: {
                    'hub.mode': 'subscribe',
                    'hub.verify_token': 'test_verify_token',
                    'hub.challenge': challenge
                }
            });
            const res = createMockResponse();
            (0, webhook_1.verifyWebhook)(req, res);
            (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(200);
            (0, vitest_1.expect)(res.send).toHaveBeenCalledWith(challenge);
        });
        (0, vitest_1.it)('should reject invalid verification token', () => {
            const req = createMockRequest({
                query: {
                    'hub.mode': 'subscribe',
                    'hub.verify_token': 'invalid_token',
                    'hub.challenge': '123456789'
                }
            });
            const res = createMockResponse();
            (0, webhook_1.verifyWebhook)(req, res);
            (0, vitest_1.expect)(res.sendStatus).toHaveBeenCalledWith(403);
        });
    });
    (0, vitest_1.describe)('handleWebhook', () => {
        (0, vitest_1.it)('should process valid message event and generate reply', async () => {
            repositories_1.shopRepository.findAll.mockResolvedValue([{
                    id: 'shop-123',
                    settings: [{
                            facebookPageId: 'page-123'
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
            repositories_2.facebookMessageRepository.create.mockResolvedValue({
                messageId: 'msg-123'
            });
            const req = createMockRequest({
                body: {
                    entry: [{
                            id: 'page-123',
                            messaging: [{
                                    sender: { id: 'user-123' },
                                    recipient: { id: 'page-123' },
                                    timestamp: Date.now(),
                                    message: {
                                        mid: 'msg-123',
                                        text: 'Hello, how can you help me?'
                                    }
                                }]
                        }]
                }
            });
            const res = createMockResponse();
            await (0, webhook_1.handleWebhook)(req, res);
            (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(200);
            (0, vitest_1.expect)(res.send).toHaveBeenCalledWith('EVENT_RECEIVED');
            (0, vitest_1.expect)(repositories_2.facebookMessageRepository.create).toHaveBeenCalled();
            (0, vitest_1.expect)(mockRAGService.retrieve).toHaveBeenCalled();
            (0, vitest_1.expect)(repositories_2.facebookMessageRepository.updateReply).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should not generate reply when auto-reply is disabled', async () => {
            repositories_1.shopRepository.findAll.mockResolvedValue([{
                    id: 'shop-123',
                    settings: [{
                            facebookPageId: 'page-123'
                        }]
                }]);
            repositories_1.settingRepository.findByShopId.mockResolvedValue({
                autoReply: false
            });
            repositories_2.facebookMessageRepository.create.mockResolvedValue({
                messageId: 'msg-123'
            });
            const req = createMockRequest({
                body: {
                    entry: [{
                            id: 'page-123',
                            messaging: [{
                                    sender: { id: 'user-123' },
                                    recipient: { id: 'page-123' },
                                    timestamp: Date.now(),
                                    message: {
                                        mid: 'msg-123',
                                        text: 'Hello, how can you help me?'
                                    }
                                }]
                        }]
                }
            });
            const res = createMockResponse();
            await (0, webhook_1.handleWebhook)(req, res);
            (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(200);
            (0, vitest_1.expect)(res.send).toHaveBeenCalledWith('EVENT_RECEIVED');
            (0, vitest_1.expect)(repositories_2.facebookMessageRepository.create).toHaveBeenCalled();
            (0, vitest_1.expect)(mockRAGService.retrieve).not.toHaveBeenCalled();
            (0, vitest_1.expect)(repositories_2.facebookMessageRepository.updateReply).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('should use fallback message when confidence threshold is not met', async () => {
            repositories_1.shopRepository.findAll.mockResolvedValue([{
                    id: 'shop-123',
                    settings: [{
                            facebookPageId: 'page-123'
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
            repositories_2.facebookMessageRepository.create.mockResolvedValue({
                messageId: 'msg-123'
            });
            const req = createMockRequest({
                body: {
                    entry: [{
                            id: 'page-123',
                            messaging: [{
                                    sender: { id: 'user-123' },
                                    recipient: { id: 'page-123' },
                                    timestamp: Date.now(),
                                    message: {
                                        mid: 'msg-123',
                                        text: 'Hello, how can you help me?'
                                    }
                                }]
                        }]
                }
            });
            const res = createMockResponse();
            await (0, webhook_1.handleWebhook)(req, res);
            (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(200);
            (0, vitest_1.expect)(res.send).toHaveBeenCalledWith('EVENT_RECEIVED');
            (0, vitest_1.expect)(repositories_2.facebookMessageRepository.create).toHaveBeenCalled();
            (0, vitest_1.expect)(mockRAGService.retrieve).toHaveBeenCalled();
            (0, vitest_1.expect)(repositories_2.facebookMessageRepository.updateReply).toHaveBeenCalledWith('msg-123', 'I cannot help with that specific question.');
        });
        (0, vitest_1.it)('should handle webhook errors gracefully and still return success', async () => {
            repositories_1.shopRepository.findAll.mockRejectedValue(new Error('Database error'));
            const req = createMockRequest({
                body: {
                    entry: []
                }
            });
            const res = createMockResponse();
            await (0, webhook_1.handleWebhook)(req, res);
            (0, vitest_1.expect)(res.status).toHaveBeenCalledWith(200);
            (0, vitest_1.expect)(res.send).toHaveBeenCalledWith('EVENT_RECEIVED');
        });
    });
});
//# sourceMappingURL=facebook-webhook.test.js.map