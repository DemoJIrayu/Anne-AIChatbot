"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleWebhook = exports.verifySignature = void 0;
exports.initializeLineIntegration = initializeLineIntegration;
const crypto_1 = __importDefault(require("crypto"));
const repositories_1 = require("../../db/postgres/repositories");
const repositories_2 = require("../../db/mongodb/repositories");
const rag_1 = require("../../rag");
const logger_1 = __importDefault(require("../../utils/logger"));
let ragServiceInstance = null;
function initializeLineIntegration(prismaClient) {
    ragServiceInstance = (0, rag_1.getRAGService)(prismaClient);
}
const verifySignature = (req, res, next) => {
    const signature = req.get('x-line-signature');
    if (!signature) {
        logger_1.default.warn('Missing LINE signature');
        res.status(400).send('Missing signature');
        return;
    }
    const body = JSON.stringify(req.body);
    const channelSecret = process.env.LINE_CHANNEL_SECRET || '';
    const expectedSignature = crypto_1.default
        .createHmac('sha256', channelSecret)
        .update(body)
        .digest('base64');
    if (signature !== expectedSignature) {
        logger_1.default.warn('LINE webhook signature verification failed', {
            signature,
            expectedSignature
        });
        res.status(403).send('Invalid signature');
        return;
    }
    next();
};
exports.verifySignature = verifySignature;
const handleWebhook = async (req, res) => {
    if (!ragServiceInstance) {
        logger_1.default.error('RAG service not initialized');
        res.status(500).send({ status: 'error' });
        return;
    }
    try {
        const events = req.body?.events || [];
        for (const event of events) {
            try {
                await processLineEvent(event, ragServiceInstance);
            }
            catch (error) {
                logger_1.default.error('Error processing LINE event', { error: error.message || error, event });
            }
        }
        res.status(200).send({ status: 'ok' });
    }
    catch (error) {
        logger_1.default.error('Error handling LINE webhook', { error: error.message || error });
        res.status(500).send({ status: 'error' });
    }
};
exports.handleWebhook = handleWebhook;
async function processLineEvent(event, ragService) {
    if (event.type !== 'message') {
        logger_1.default.info('Skipping non-message event', { type: event.type });
        return;
    }
    const channelId = event.source?.userId || event.source?.groupId || event.source?.roomId;
    const replyToken = event.replyToken;
    const timestamp = event.timestamp ? new Date(event.timestamp) : new Date();
    if (!channelId || !replyToken) {
        logger_1.default.warn('Invalid LINE event - missing channel or reply token', { event });
        return;
    }
    const shop = await getShopByChannelId(channelId);
    if (!shop) {
        logger_1.default.warn('No shop found for LINE channel', { channelId });
        return;
    }
    if (event.message?.type === 'text') {
        const messageId = event.message.id;
        const text = event.message.text;
        const savedMessage = await repositories_2.lineMessageRepository.create({
            messageId,
            userId: channelId,
            shopId: shop.id,
            timestamp,
            type: 'text',
            text,
            payload: event
        });
        logger_1.default.info('Saved LINE message', { messageId });
        const reply = await generateAutoReply(text, shop.id, ragService);
        if (reply) {
            await sendLineReply(replyToken, reply);
            await repositories_2.lineMessageRepository.updateReply(messageId, reply);
            logger_1.default.info('Sent LINE auto-reply', { messageId, reply });
        }
    }
}
async function getShopByChannelId(channelId) {
    try {
        const shops = await repositories_1.shopRepository.findAll();
        return shops.find(shop => {
            const shopWithSettings = shop;
            return shopWithSettings.settings &&
                Array.isArray(shopWithSettings.settings) &&
                shopWithSettings.settings.some((setting) => setting.lineChannelId === channelId);
        }) || null;
    }
    catch (error) {
        logger_1.default.error('Error getting shop by LINE channel ID', { error: error.message || error, channelId });
        return null;
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
async function sendLineReply(replyToken, message) {
    logger_1.default.info('Would send LINE reply', {
        replyToken,
        message
    });
}
//# sourceMappingURL=webhook.js.map