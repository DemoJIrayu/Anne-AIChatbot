"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.facebookMessageRepository = exports.lineMessageRepository = exports.FacebookMessageRepository = exports.LineMessageRepository = void 0;
const models_1 = require("./models");
const logger_1 = __importDefault(require("../../utils/logger"));
class LineMessageRepository {
    async create(data) {
        try {
            const message = new models_1.LineMessage(data);
            const savedMessage = await message.save();
            logger_1.default.info(`Saved LINE message: ${savedMessage.messageId}`);
            return savedMessage;
        }
        catch (error) {
            logger_1.default.error('Error saving LINE message:', error);
            throw error;
        }
    }
    async findById(messageId) {
        try {
            return await models_1.LineMessage.findOne({ messageId }).exec();
        }
        catch (error) {
            logger_1.default.error(`Error finding LINE message by id ${messageId}:`, error);
            throw error;
        }
    }
    async findByUserId(userId, limit = 10) {
        try {
            return await models_1.LineMessage.find({ userId })
                .sort({ timestamp: -1 })
                .limit(limit)
                .exec();
        }
        catch (error) {
            logger_1.default.error(`Error finding LINE messages by user id ${userId}:`, error);
            throw error;
        }
    }
    async findByShopId(shopId, limit = 10) {
        try {
            return await models_1.LineMessage.find({ shopId })
                .sort({ timestamp: -1 })
                .limit(limit)
                .exec();
        }
        catch (error) {
            logger_1.default.error(`Error finding LINE messages by shop id ${shopId}:`, error);
            throw error;
        }
    }
    async updateReply(messageId, reply) {
        try {
            const updatedMessage = await models_1.LineMessage.findOneAndUpdate({ messageId }, { reply }, { new: true }).exec();
            logger_1.default.info(`Updated reply for LINE message: ${messageId}`);
            return updatedMessage;
        }
        catch (error) {
            logger_1.default.error(`Error updating reply for LINE message ${messageId}:`, error);
            throw error;
        }
    }
    async deleteById(messageId) {
        try {
            const deletedMessage = await models_1.LineMessage.findOneAndDelete({ messageId }).exec();
            logger_1.default.info(`Deleted LINE message: ${messageId}`);
            return deletedMessage;
        }
        catch (error) {
            logger_1.default.error(`Error deleting LINE message ${messageId}:`, error);
            throw error;
        }
    }
}
exports.LineMessageRepository = LineMessageRepository;
class FacebookMessageRepository {
    async create(data) {
        try {
            const message = new models_1.FacebookMessage(data);
            const savedMessage = await message.save();
            logger_1.default.info(`Saved Facebook message: ${savedMessage.messageId}`);
            return savedMessage;
        }
        catch (error) {
            logger_1.default.error('Error saving Facebook message:', error);
            throw error;
        }
    }
    async findById(messageId) {
        try {
            return await models_1.FacebookMessage.findOne({ messageId }).exec();
        }
        catch (error) {
            logger_1.default.error(`Error finding Facebook message by id ${messageId}:`, error);
            throw error;
        }
    }
    async findByUserId(userId, limit = 10) {
        try {
            return await models_1.FacebookMessage.find({ userId })
                .sort({ timestamp: -1 })
                .limit(limit)
                .exec();
        }
        catch (error) {
            logger_1.default.error(`Error finding Facebook messages by user id ${userId}:`, error);
            throw error;
        }
    }
    async findByShopId(shopId, limit = 10) {
        try {
            return await models_1.FacebookMessage.find({ shopId })
                .sort({ timestamp: -1 })
                .limit(limit)
                .exec();
        }
        catch (error) {
            logger_1.default.error(`Error finding Facebook messages by shop id ${shopId}:`, error);
            throw error;
        }
    }
    async updateReply(messageId, reply) {
        try {
            const updatedMessage = await models_1.FacebookMessage.findOneAndUpdate({ messageId }, { reply }, { new: true }).exec();
            logger_1.default.info(`Updated reply for Facebook message: ${messageId}`);
            return updatedMessage;
        }
        catch (error) {
            logger_1.default.error(`Error updating reply for Facebook message ${messageId}:`, error);
            throw error;
        }
    }
    async deleteById(messageId) {
        try {
            const deletedMessage = await models_1.FacebookMessage.findOneAndDelete({ messageId }).exec();
            logger_1.default.info(`Deleted Facebook message: ${messageId}`);
            return deletedMessage;
        }
        catch (error) {
            logger_1.default.error(`Error deleting Facebook message ${messageId}:`, error);
            throw error;
        }
    }
}
exports.FacebookMessageRepository = FacebookMessageRepository;
exports.lineMessageRepository = new LineMessageRepository();
exports.facebookMessageRepository = new FacebookMessageRepository();
//# sourceMappingURL=repositories.js.map