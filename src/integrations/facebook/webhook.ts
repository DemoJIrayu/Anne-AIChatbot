import { Request, Response } from 'express';
import crypto from 'crypto';
import { shopRepository, settingRepository } from '../../db/postgres/repositories';
import { facebookMessageRepository } from '../../db/mongodb/repositories';
import { getRAGService } from '../../rag';
import logger from '../../utils/logger';
import { PrismaClient } from '@prisma/client';

// We'll initialize this when the app starts
let ragServiceInstance: ReturnType<typeof getRAGService> | null = null;

export function initializeFacebookIntegration(prismaClient: PrismaClient) {
  ragServiceInstance = getRAGService(prismaClient);
}

// Verify Facebook webhook challenge
export const verifyWebhook = (req: Request, res: Response): void => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token && challenge) {
    if (mode === 'subscribe' && token === process.env.FACEBOOK_VERIFY_TOKEN) {
      logger.info('Facebook webhook verification successful');
      res.status(200).send(challenge);
      return;
    } else {
      logger.warn('Facebook webhook verification failed', {
        mode,
        token,
        expectedToken: process.env.FACEBOOK_VERIFY_TOKEN
      });
    }
  }
  
  res.sendStatus(403);
};

// Handle Facebook webhook events
export const handleWebhook = async (req: Request, res: Response): Promise<void> => {
  if (!ragServiceInstance) {
    logger.error('RAG service not initialized');
    res.status(500).send('ERROR');
    return;
  }

  try {
    // Verify signature if provided
    const signature = req.get('x-hub-signature-256');
    if (signature) {
      const expectedSignature = 'sha256=' + 
        crypto.createHmac('sha256', process.env.FACEBOOK_APP_SECRET || '')
          .update(JSON.stringify(req.body))
          .digest('hex');
          
      if (signature !== expectedSignature) {
        logger.warn('Facebook webhook signature verification failed');
        res.sendStatus(403);
        return;
      }
    }

    // Process events
    const entries = req.body?.entry || [];
    
    for (const entry of entries) {
      const pageId = entry.id;
      const messagingEvents = entry.messaging || [];
      
      // Find shop by page ID
      const shop = await getShopByPageId(pageId);
      if (!shop) {
        logger.warn('No shop found for Facebook page', { pageId });
        continue;
      }
      
      for (const event of messagingEvents) {
        try {
          await processMessageEvent(event, shop.id, pageId, ragServiceInstance);
        } catch (error: any) {
          logger.error('Error processing Facebook message event', { error: error.message || error, event });
        }
      }
    }
    
    res.status(200).send('EVENT_RECEIVED');
  } catch (error: any) {
    logger.error('Error handling Facebook webhook', { error: error.message || error });
    res.status(500).send('ERROR');
  }
};

// Get shop by Facebook page ID
async function getShopByPageId(pageId: string) {
  try {
    // In a real implementation, we would have a mapping between page IDs and shops
    // For now, we'll find the first shop with Facebook settings containing this page ID
    const shops = await shopRepository.findAll();
    return shops.find(shop => {
      // Cast to any to avoid TypeScript errors with the included settings
      const shopWithSettings: any = shop;
      return shopWithSettings.settings && 
             Array.isArray(shopWithSettings.settings) && 
             shopWithSettings.settings.some((setting: any) => setting.facebookPageId === pageId);
    }) || null;
  } catch (error: any) {
    logger.error('Error getting shop by Facebook page ID', { error: error.message || error, pageId });
    return null;
  }
}

// Process individual message event
async function processMessageEvent(event: any, shopId: string, pageId: string, ragService: ReturnType<typeof getRAGService>) {
  const senderId = event.sender?.id;
  const recipientId = event.recipient?.id;
  const timestamp = event.timestamp ? new Date(event.timestamp) : new Date();
  
  if (!senderId || !recipientId) {
    logger.warn('Invalid Facebook message event - missing sender or recipient', { event });
    return;
  }
  
  // Handle different message types
  if (event.message) {
    const messageId = event.message.mid;
    const text = event.message.text;
    
    // Save incoming message
    const savedMessage = await facebookMessageRepository.create({
      messageId,
      userId: senderId,
      shopId,
      timestamp,
      type: 'text',
      text,
      payload: event
    });
    
    logger.info('Saved Facebook message', { messageId });
    
    // Only process text messages
    if (text) {
      // Generate auto-reply using RAG
      const reply = await generateAutoReply(text, shopId, ragService);
      
      if (reply) {
        // Send reply via Facebook API
        await sendFacebookReply(senderId, reply, pageId);
        
        // Update message with reply
        await facebookMessageRepository.updateReply(messageId, reply);
        
        logger.info('Sent Facebook auto-reply', { messageId, reply });
      }
    }
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

// Send reply via Facebook API
async function sendFacebookReply(recipientId: string, message: string, pageId: string): Promise<void> {
  // In a real implementation, we would make an HTTP request to Facebook's Send API
  // For now, we'll just log the action
  
  logger.info('Would send Facebook reply', {
    recipientId,
    message,
    pageId
  });
  
  // Example of what the real implementation would look like:
  /*
  const accessToken = getFacebookAccessToken(pageId); // Get token for this page
  const response = await fetch(`https://graph.facebook.com/v17.0/me/messages?access_token=${accessToken}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text: message }
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    logger.error('Failed to send Facebook reply', { error, recipientId });
  }
  */
}