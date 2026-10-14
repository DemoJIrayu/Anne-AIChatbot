import { Types } from 'mongoose';
import { LineMessage, FacebookMessage, ILineMessage, IFacebookMessage } from './models';
import logger from '../../utils/logger';

export class LineMessageRepository {
  async create(data: any): Promise<ILineMessage> {
    try {
      const message = new LineMessage(data);
      const savedMessage = await message.save();
      logger.info(`Saved LINE message: ${savedMessage.messageId}`);
      return savedMessage;
    } catch (error: any) {
      logger.error('Error saving LINE message:', error);
      throw error;
    }
  }

  async findById(messageId: string): Promise<ILineMessage | null> {
    try {
      return await LineMessage.findOne({ messageId }).exec();
    } catch (error: any) {
      logger.error(`Error finding LINE message by id ${messageId}:`, error);
      throw error;
    }
  }

  async findByUserId(userId: string, limit: number = 10): Promise<ILineMessage[]> {
    try {
      return await LineMessage.find({ userId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .exec();
    } catch (error: any) {
      logger.error(`Error finding LINE messages by user id ${userId}:`, error);
      throw error;
    }
  }

  async findByShopId(shopId: string, limit: number = 10): Promise<ILineMessage[]> {
    try {
      return await LineMessage.find({ shopId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .exec();
    } catch (error: any) {
      logger.error(`Error finding LINE messages by shop id ${shopId}:`, error);
      throw error;
    }
  }

  async updateReply(messageId: string, reply: string): Promise<ILineMessage | null> {
    try {
      const updatedMessage = await LineMessage.findOneAndUpdate(
        { messageId },
        { reply },
        { new: true }
      ).exec();
      logger.info(`Updated reply for LINE message: ${messageId}`);
      return updatedMessage;
    } catch (error: any) {
      logger.error(`Error updating reply for LINE message ${messageId}:`, error);
      throw error;
    }
  }

  async deleteById(messageId: string): Promise<ILineMessage | null> {
    try {
      const deletedMessage = await LineMessage.findOneAndDelete({ messageId }).exec();
      logger.info(`Deleted LINE message: ${messageId}`);
      return deletedMessage;
    } catch (error: any) {
      logger.error(`Error deleting LINE message ${messageId}:`, error);
      throw error;
    }
  }
}

export class FacebookMessageRepository {
  async create(data: any): Promise<IFacebookMessage> {
    try {
      const message = new FacebookMessage(data);
      const savedMessage = await message.save();
      logger.info(`Saved Facebook message: ${savedMessage.messageId}`);
      return savedMessage;
    } catch (error: any) {
      logger.error('Error saving Facebook message:', error);
      throw error;
    }
  }

  async findById(messageId: string): Promise<IFacebookMessage | null> {
    try {
      return await FacebookMessage.findOne({ messageId }).exec();
    } catch (error: any) {
      logger.error(`Error finding Facebook message by id ${messageId}:`, error);
      throw error;
    }
  }

  async findByUserId(userId: string, limit: number = 10): Promise<IFacebookMessage[]> {
    try {
      return await FacebookMessage.find({ userId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .exec();
    } catch (error: any) {
      logger.error(`Error finding Facebook messages by user id ${userId}:`, error);
      throw error;
    }
  }

  async findByShopId(shopId: string, limit: number = 10): Promise<IFacebookMessage[]> {
    try {
      return await FacebookMessage.find({ shopId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .exec();
    } catch (error: any) {
      logger.error(`Error finding Facebook messages by shop id ${shopId}:`, error);
      throw error;
    }
  }

  async updateReply(messageId: string, reply: string): Promise<IFacebookMessage | null> {
    try {
      const updatedMessage = await FacebookMessage.findOneAndUpdate(
        { messageId },
        { reply },
        { new: true }
      ).exec();
      logger.info(`Updated reply for Facebook message: ${messageId}`);
      return updatedMessage;
    } catch (error: any) {
      logger.error(`Error updating reply for Facebook message ${messageId}:`, error);
      throw error;
    }
  }

  async deleteById(messageId: string): Promise<IFacebookMessage | null> {
    try {
      const deletedMessage = await FacebookMessage.findOneAndDelete({ messageId }).exec();
      logger.info(`Deleted Facebook message: ${messageId}`);
      return deletedMessage;
    } catch (error: any) {
      logger.error(`Error deleting Facebook message ${messageId}:`, error);
      throw error;
    }
  }
}

// Export singleton instances
export const lineMessageRepository = new LineMessageRepository();
export const facebookMessageRepository = new FacebookMessageRepository();