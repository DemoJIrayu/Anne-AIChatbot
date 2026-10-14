import { Router, Request, Response } from 'express';
import { knowledgeSourceRepository, shopRepository } from '../db/postgres/repositories';
import { authenticate } from './middleware';
import logger from '../utils/logger';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * GET /api/shops/:shopId/knowledge-sources
 * List all knowledge sources for a shop
 */
router.get('/:shopId/knowledge-sources', async (req: Request, res: Response) => {
  try {
    const { shopId } = req.params;
    
    // Validate shop exists
    const shop = await shopRepository.findById(shopId);
    if (!shop) {
      res.status(404).json({ error: 'Shop not found' });
      return;
    }
    
    const knowledgeSources = await knowledgeSourceRepository.findByShopId(shopId);
    res.json(knowledgeSources);
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error('Error fetching knowledge sources:', { error: error.message });
    } else {
      logger.error('Error fetching knowledge sources:', { error: 'Unknown error' });
    }
    res.status(500).json({ error: 'Failed to fetch knowledge sources' });
  }
});

/**
 * POST /api/shops/:shopId/knowledge-sources
 * Create a new knowledge source for a shop
 */
router.post('/:shopId/knowledge-sources', async (req: Request, res: Response) => {
  try {
    const { shopId } = req.params;
    const { name, type, source } = req.body;
    
    // Validate shop exists
    const shop = await shopRepository.findById(shopId);
    if (!shop) {
      res.status(404).json({ error: 'Shop not found' });
      return;
    }
    
    // Validate required fields
    if (!name || !type || !source) {
      res.status(400).json({ error: 'Name, type, and source are required' });
      return;
    }
    
    // Validate type
    const validTypes = ['text', 'url'];
    if (!validTypes.includes(type)) {
      res.status(400).json({ error: `Type must be one of: ${validTypes.join(', ')}` });
      return;
    }
    
    const knowledgeSource = await knowledgeSourceRepository.create({
      shopId,
      name,
      type,
      source,
      status: 'pending',
    });
    
    res.status(201).json(knowledgeSource);
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error('Error creating knowledge source:', { error: error.message });
    } else {
      logger.error('Error creating knowledge source:', { error: 'Unknown error' });
    }
    res.status(500).json({ error: 'Failed to create knowledge source' });
  }
});

/**
 * GET /api/knowledge-sources/:id
 * Get a specific knowledge source by ID
 */
router.get('/knowledge-sources/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const knowledgeSource = await knowledgeSourceRepository.findById(id);
    
    if (!knowledgeSource) {
      res.status(404).json({ error: 'Knowledge source not found' });
      return;
    }
    
    res.json(knowledgeSource);
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error('Error fetching knowledge source:', { error: error.message });
    } else {
      logger.error('Error fetching knowledge source:', { error: 'Unknown error' });
    }
    res.status(500).json({ error: 'Failed to fetch knowledge source' });
  }
});

/**
 * PUT /api/knowledge-sources/:id
 * Update a knowledge source
 */
router.put('/knowledge-sources/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, type, source } = req.body;
    
    // Validate knowledge source exists
    const existingSource = await knowledgeSourceRepository.findById(id);
    if (!existingSource) {
      res.status(404).json({ error: 'Knowledge source not found' });
      return;
    }
    
    // Validate type if provided
    if (type) {
      const validTypes = ['text', 'url'];
      if (!validTypes.includes(type)) {
        res.status(400).json({ error: `Type must be one of: ${validTypes.join(', ')}` });
        return;
      }
    }
    
    const knowledgeSource = await knowledgeSourceRepository.update(id, {
      name: name || existingSource.name,
      type: type || existingSource.type,
      source: source || existingSource.source,
    });
    
    res.json(knowledgeSource);
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error('Error updating knowledge source:', { error: error.message });
    } else {
      logger.error('Error updating knowledge source:', { error: 'Unknown error' });
    }
    res.status(500).json({ error: 'Failed to update knowledge source' });
  }
});

/**
 * DELETE /api/knowledge-sources/:id
 * Delete a knowledge source
 */
router.delete('/knowledge-sources/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Validate knowledge source exists
    const existingSource = await knowledgeSourceRepository.findById(id);
    if (!existingSource) {
      res.status(404).json({ error: 'Knowledge source not found' });
      return;
    }
    
    await knowledgeSourceRepository.delete(id);
    res.status(204).send();
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error('Error deleting knowledge source:', { error: error.message });
    } else {
      logger.error('Error deleting knowledge source:', { error: 'Unknown error' });
    }
    res.status(500).json({ error: 'Failed to delete knowledge source' });
  }
});

/**
 * PATCH /api/knowledge-sources/:id/status
 * Update the status of a knowledge source
 */
router.patch('/knowledge-sources/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Validate knowledge source exists
    const existingSource = await knowledgeSourceRepository.findById(id);
    if (!existingSource) {
      res.status(404).json({ error: 'Knowledge source not found' });
      return;
    }
    
    // Validate status
    const validStatuses = ['pending', 'processing', 'ready', 'error'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
      return;
    }
    
    const knowledgeSource = await knowledgeSourceRepository.updateStatus(id, status);
    res.json(knowledgeSource);
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error('Error updating knowledge source status:', { error: error.message });
    } else {
      logger.error('Error updating knowledge source status:', { error: 'Unknown error' });
    }
    res.status(500).json({ error: 'Failed to update knowledge source status' });
  }
});

export default router;