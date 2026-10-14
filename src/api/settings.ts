import { Router, Request, Response } from 'express';
import { settingRepository, shopRepository } from '../db/postgres/repositories';
import { authenticate } from './middleware';
import logger from '../utils/logger';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * GET /api/shops/:shopId/settings
 * Get settings for a shop
 */
router.get('/:shopId/settings', async (req: Request, res: Response) => {
  try {
    const { shopId } = req.params;
    
    // Validate shop exists
    const shop = await shopRepository.findById(shopId);
    if (!shop) {
      res.status(404).json({ error: 'Shop not found' });
      return;
    }
    
    const settings = await settingRepository.findByShopId(shopId);
    res.json(settings || {});
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error('Error fetching settings:', { error: error.message });
    } else {
      logger.error('Error fetching settings:', { error: 'Unknown error' });
    }
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

/**
 * PUT /api/shops/:shopId/settings
 * Update settings for a shop
 */
router.put('/:shopId/settings', async (req: Request, res: Response) => {
  try {
    const { shopId } = req.params;
    const {
      autoReply,
      welcomeMessage,
      systemPrompt,
      replyTone,
      confidenceThreshold,
      fallbackMessage,
    } = req.body;
    
    // Validate shop exists
    const shop = await shopRepository.findById(shopId);
    if (!shop) {
      res.status(404).json({ error: 'Shop not found' });
      return;
    }
    
    // Validate confidence threshold if provided
    if (confidenceThreshold !== undefined && (confidenceThreshold < 0 || confidenceThreshold > 1)) {
      res.status(400).json({ error: 'Confidence threshold must be between 0 and 1' });
      return;
    }
    
    const settings = await settingRepository.updateByShopId(shopId, {
      autoReply,
      welcomeMessage,
      systemPrompt,
      replyTone,
      confidenceThreshold,
      fallbackMessage,
    });
    
    res.json(settings);
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error('Error updating settings:', { error: error.message });
    } else {
      logger.error('Error updating settings:', { error: 'Unknown error' });
    }
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

/**
 * PATCH /api/shops/:shopId/settings/auto-reply
 * Toggle auto-reply on/off for a shop
 */
router.patch('/:shopId/settings/auto-reply', async (req: Request, res: Response) => {
  try {
    const { shopId } = req.params;
    const { enabled } = req.body;
    
    // Validate shop exists
    const shop = await shopRepository.findById(shopId);
    if (!shop) {
      res.status(404).json({ error: 'Shop not found' });
      return;
    }
    
    // Validate enabled is boolean
    if (typeof enabled !== 'boolean') {
      res.status(400).json({ error: 'Enabled must be a boolean value' });
      return;
    }
    
    const settings = await settingRepository.updateByShopId(shopId, {
      autoReply: enabled,
    });
    
    res.json(settings);
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error('Error toggling auto-reply:', { error: error.message });
    } else {
      logger.error('Error toggling auto-reply:', { error: 'Unknown error' });
    }
    res.status(500).json({ error: 'Failed to toggle auto-reply' });
  }
});

export default router;