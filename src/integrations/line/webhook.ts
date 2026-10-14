import { Request, Response } from 'express';
import crypto from 'crypto';
import { shopRepository, settingRepository } from '../../db/postgres/repositories';
import { lineMessageRepository } from '../../db/mongodb/repositories';
import { getRAGService } from '../../rag';
import logger from '../../utils/logger';
import { PrismaClient } from '@prisma/client';

// We'll initialize this when the app starts
let ragServiceInstance: ReturnType<typeof getRAGService> | null = null;

export function initializeLineIntegration(prismaClient: PrismaClient) {
  ragServiceInstance = getRAGService(prismaClient);
}

// Verify LINE webhook signature
export const verifySignature = (req: Request, res: Response, next: Function): void => {
  const signature = req.get('x-line-signature');
  if (!signature) {
    logger.warn('Missing LINE signature');
    res.status(400).send('Missing signature');
    return;
  }

  const body = JSON.stringify(req.body);
  const channelSecret = process.env.LINE_CHANNEL_SECRET || '';
  
  const expectedSignature = crypto
    .createHmac('sha256', channelSecret)
    .update(body)
    .digest('base64');

  if (signature !== expectedSignature) {
    logger.warn('LINE webhook signature verification failed', {
      signature,
      expectedSignature
    });
    res.status(403).send('Invalid signature');
    return;
  }

  next();
};

// Handle LINE webhook events
export const handleWebhook = async (req: Request, res: Response): Promise<void> => {
  if (!ragServiceInstance) {
    logger.error('RAG service not initialized');
    res.status(500).send({ status: 'error' });
    return;
  }

  try {
    const events = req.body?.events || [];
    
    for (const event of events) {
      try {
        await processLineEvent(event, ragServiceInstance);
      } catch (error: any) {
        logger.error('Error processing LINE event', { error: error.message || error, event });
      }
    }
    
    res.status(200).send({ status: 'ok' });
  } catch (error: any) {
    logger.error('Error handling LINE webhook', { error: error.message || error });
    res.status(500).send({ status: 'error' });
  }
};

// Process individual LINE event
async function processLineEvent(event: any, ragService: ReturnType<typeof getRAGService>) {
  // Only process message events
  if (event.type !== 'message') {
    logger.info('Skipping non-message event', { type: event.type });
    return;
  }
  
  const channelId = event.source?.userId || event.source?.groupId || event.source?.roomId;
  const replyToken = event.replyToken;
  const timestamp = event.timestamp ? new Date(event.timestamp) : new Date();
  
  if (!channelId || !replyToken) {
    logger.warn('Invalid LINE event - missing channel or reply token', { event });
    return;
  }
  
  // Find shop by channel ID
  const shop = await getShopByChannelId(channelId);
  if (!shop) {
    logger.warn('No shop found for LINE channel', { channelId });
    return;
  }
  
  // Handle different message types
  if (event.message?.type === 'text') {
    const messageId = event.message.id;
    const text = event.message.text;
    
    // Save incoming message
    const savedMessage = await lineMessageRepository.create({
      messageId,
      userId: channelId,
      shopId: shop.id,
      timestamp,
      type: 'text',
      text,
      payload: event
    });
    
    logger.info('Saved LINE message', { messageId });
    
    // Generate auto-reply using RAG
    const reply = await generateAutoReply(text, shop.id, ragService);
    
    if (reply) {
      // Send reply via LINE API
      await sendLineReply(replyToken, reply);
      
      // Update message with reply
      await lineMessageRepository.updateReply(messageId, reply);
      
      logger.info('Sent LINE auto-reply', { messageId, reply });
    }
  }
}

// Get shop by LINE channel ID
async function getShopByChannelId(channelId: string) {
  try {
    // In a real implementation, we would have a mapping between channel IDs and shops
    // For now, we'll find the first shop with LINE settings containing this channel ID
    const shops = await shopRepository.findAll();
    return shops.find(shop => {
      // Cast to any to avoid TypeScript errors with the included settings
      const shopWithSettings: any = shop;
      return shopWithSettings.settings && 
             Array.isArray(shopWithSettings.settings) && 
             shopWithSettings.settings.some((setting: any) => setting.lineChannelId === channelId);
    }) || null;
  } catch (error: any) {
    logger.error('Error getting shop by LINE channel ID', { error: error.message || error, channelId });
    return null;
  }
}

// Generate auto-reply using RAG
async function generateAutoReply(message: string, shopId: string, ragService: ReturnType<typeof getRAGService>): Promise<string | null> {
  try {
    // Get shop settings
    const settings = await settingRepository.findByShopId(shopId);
    
    // Check if auto-reply is enabled
    if (!settings || !settings.autoReply) {
      logger.info('Auto-reply is disabled for shop', { shopId });
      return null;
    }
    
    // Retrieve relevant context
    const results = await ragService.retrieve(message, shopId);
    
    // Check confidence threshold if set
    if (settings.confidenceThreshold && results.length > 0) {
      const highestScore = results[0].similarity;
      if (highestScore < settings.confidenceThreshold) {
        logger.info('Retrieval confidence too low, using fallback', { 
          shopId, 
          highestScore, 
          threshold: settings.confidenceThreshold 
        });
        
        // Use fallback message if configured
        return settings.fallbackMessage || null;
      }
    }
    
    // Build context from retrieved chunks
    const context = results.map((result: any) => result.chunk.content).join('\n\n');
    
    // Generate response using a simple prompt
    // In production, this would use a proper LLM API
    let reply = '';
    if (context) {
      reply = `Based on our records:\n\n${context}\n\nHow else can I help you?`;
    } else {
      reply = "I'm sorry, I don't have information about that. Is there something else I can help you with?";
    }
    
    return reply;
  } catch (error: any) {
    logger.error('Error generating auto-reply', { error: error.message || error, shopId });
    return "Sorry, I'm having trouble processing your request right now. Please try again later.";
  }
}

// Send reply via LINE API
async function sendLineReply(replyToken: string, message: string): Promise<void> {
  // In a real implementation, we would make an HTTP request to LINE's Reply API
  // For now, we'll just log the action
  
  logger.info('Would send LINE reply', {
    replyToken,
    message
  });
  
  // Example of what the real implementation would look like:
  /*
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const response = await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${channelAccessToken}`
    },
    body: JSON.stringify({
      replyToken,
      messages: [{
        type: 'text',
        text: message
      }]
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    logger.error('Failed to send LINE reply', { error, replyToken });
  }
  */
}