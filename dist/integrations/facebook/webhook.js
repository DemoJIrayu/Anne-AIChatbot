"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleWebhook = exports.verifyWebhook = void 0;
exports.initializeFacebookIntegration = initializeFacebookIntegration;
const crypto_1 = __importDefault(require("crypto"));
const repositories_1 = require("../../db/postgres/repositories");
const repositories_2 = require("../../db/mongodb/repositories");
const rag_1 = require("../../rag");
const logger_1 = __importDefault(require("../../utils/logger"));
let ragServiceInstance = null;
function initializeFacebookIntegration(prismaClient) {
    ragServiceInstance = (0, rag_1.getRAGService)(prismaClient);
}
const verifyWebhook = (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode && token && challenge) {
        if (mode === 'subscribe' && token === process.env.FACEBOOK_VERIFY_TOKEN) {
            logger_1.default.info('Facebook webhook verification successful');
            res.status(200).send(challenge);
            return;
        }
        else {
            logger_1.default.warn('Facebook webhook verification failed', {
                mode,
                token,
                expectedToken: process.env.FACEBOOK_VERIFY_TOKEN
            });
        }
    }
    res.sendStatus(403);
};
exports.verifyWebhook = verifyWebhook;
const handleWebhook = async (req, res) => {
    if (!ragServiceInstance) {
        logger_1.default.error('RAG service not initialized');
        res.status(500).send('ERROR');
        return;
    }
    try {
        const signature = req.get('x-hub-signature-256');
        if (signature) {
            const expectedSignature = 'sha256=' +
                crypto_1.default.createHmac('sha256', process.env.FACEBOOK_APP_SECRET || '')
                    .update(JSON.stringify(req.body))
                    .digest('hex');
            if (signature !== expectedSignature) {
                logger_1.default.warn('Facebook webhook signature verification failed');
                res.sendStatus(403);
                return;
            }
        }
        const entries = req.body?.entry || [];
        for (const entry of entries) {
            const pageId = entry.id;
            const messagingEvents = entry.messaging || [];
            const shop = await getShopByPageId(pageId);
            if (!shop) {
                logger_1.default.warn('No shop found for Facebook page', { pageId });
                continue;
            }
            for (const event of messagingEvents) {
                try {
                    await processMessageEvent(event, shop.id, pageId, ragServiceInstance);
                }
                catch (error) {
                    logger_1.default.error('Error processing Facebook message event', { error: error.message || error, event });
                }
            }
        }
        res.status(200).send('EVENT_RECEIVED');
    }
    catch (error) {
        logger_1.default.error('Error handling Facebook webhook', { error: error.message || error });
        res.status(500).send('ERROR');
    }
};
exports.handleWebhook = handleWebhook;
async function getShopByPageId(pageId) {
    try {
        const shops = await repositories_1.shopRepository.findAll();
        return shops.find(shop => {
            const shopWithSettings = shop;
            return shopWithSettings.settings &&
                Array.isArray(shopWithSettings.settings) &&
                shopWithSettings.settings.some((setting) => setting.facebookPageId === pageId);
        }) || null;
    }
    catch (error) {
        logger_1.default.error('Error getting shop by Facebook page ID', { error: error.message || error, pageId });
        return null;
    }
}
async function processMessageEvent(event, shopId, pageId, ragService) {
    const senderId = event.sender?.id;
    const recipientId = event.recipient?.id;
    const timestamp = event.timestamp ? new Date(event.timestamp) : new Date();
    if (!senderId || !recipientId) {
        logger_1.default.warn('Invalid Facebook message event - missing sender or recipient', { event });
        return;
    }
    if (event.message) {
        const messageId = event.message.mid;
        const text = event.message.text;
        const savedMessage = await repositories_2.facebookMessageRepository.create({
            messageId,
            userId: senderId,
            shopId,
            timestamp,
            type: 'text',
            text,
            payload: event
        });
        logger_1.default.info('Saved Facebook message', { messageId });
        if (text) {
            const reply = await generateAutoReply(text, shopId, ragService);
            if (reply) {
                await sendFacebookReply(senderId, reply, pageId);
                await repositories_2.facebookMessageRepository.updateReply(messageId, reply);
                logger_1.default.info('Sent Facebook auto-reply', { messageId, reply });
            }
        }
    }
}
async function generateAutoReply(message, shopId, ragService) {
    try {
        const settings = await repositories_1.settingRepository.findByShopId(shopId);
        if (!settings || !settings.autoReply) {
            logger_1.default.info('Auto-reply is disabled for shop', { shopId });
            return null;
        }
        const results = await ragService.retrieve(message, shopId);
        if (settings.confidenceThreshold && results.length > 0) {
            const highestScore = results[0].similarity;
            if (highestScore < settings.confidenceThreshold) {
                logger_1.default.info('Retrieval confidence too low, using fallback', {
                    shopId,
                    highestScore,
                    threshold: settings.confidenceThreshold
                });
                return settings.fallbackMessage || null;
            }
        }
        const context = results.map((result) => result.chunk.content).join('\n\n');
        let reply = '';
        if (context) {
            reply = `Based on our records:\n\n${context}\n\nHow else can I help you?`;
        }
        else {
            reply = "I'm sorry, I don't have information about that. Is there something else I can help you with?";
        }
        return reply;
    }
    catch (error) {
        logger_1.default.error('Error generating auto-reply', { error: error.message || error, shopId });
        return "Sorry, I'm having trouble processing your request right now. Please try again later.";
    }
}
async function sendFacebookReply(recipientId, message, pageId) {
    logger_1.default.info('Would send Facebook reply', {
        recipientId,
        message,
        pageId
    });
}
//# sourceMappingURL=webhook.js.map