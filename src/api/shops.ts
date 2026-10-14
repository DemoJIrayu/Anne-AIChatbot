import { Router, Request, Response } from 'express';
import { 
  shopRepository, 
  BusinessOwnerRepository,
} from '../db/postgres/repositories';
import { authenticate } from './middleware';
import logger from '../utils/logger';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * GET /api/shops
 * List all shops
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const shops = await shopRepository.findAll();
    res.json(shops);
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error('Error fetching shops:', { error: error.message });
    } else {
      logger.error('Error fetching shops:', { error: 'Unknown error' });
    }
    res.status(500).json({ error: 'Failed to fetch shops' });
  }
});

/**
 * GET /api/shops/:id
 * Get a specific shop by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const shop = await shopRepository.findById(id);
    
    if (!shop) {
      res.status(404).json({ error: 'Shop not found' });
      return;
    }
    
    res.json(shop);
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error('Error fetching shop:', { error: error.message });
    } else {
      logger.error('Error fetching shop:', { error: 'Unknown error' });
    }
    res.status(500).json({ error: 'Failed to fetch shop' });
  }
});

/**
 * POST /api/shops
 * Create a new shop
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, businessOwnerId } = req.body;
    
    // Validate required fields
    if (!name || !businessOwnerId) {
      res.status(400).json({ error: 'Name and businessOwnerId are required' });
      return;
    }
    
    // Validate business owner exists
    const businessOwnerRepo = new BusinessOwnerRepository();
    const businessOwner = await businessOwnerRepo.findById(businessOwnerId);
    if (!businessOwner) {
      res.status(400).json({ error: 'Business owner not found' });
      return;
    }
    
    const shop = await shopRepository.create({
      name,
      businessOwnerId,
    });
    
    res.status(201).json(shop);
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error('Error creating shop:', { error: error.message });
    } else {
      logger.error('Error creating shop:', { error: 'Unknown error' });
    }
    res.status(500).json({ error: 'Failed to create shop' });
  }
});

/**
 * PUT /api/shops/:id
 * Update a shop
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    // Validate shop exists
    const existingShop = await shopRepository.findById(id);
    if (!existingShop) {
      res.status(404).json({ error: 'Shop not found' });
      return;
    }
    
    const shop = await shopRepository.update(id, {
      name: name || existingShop.name,
    });
    
    res.json(shop);
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error('Error updating shop:', { error: error.message });
    } else {
      logger.error('Error updating shop:', { error: 'Unknown error' });
    }
    res.status(500).json({ error: 'Failed to update shop' });
  }
});

/**
 * DELETE /api/shops/:id
 * Delete a shop
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Validate shop exists
    const existingShop = await shopRepository.findById(id);
    if (!existingShop) {
      res.status(404).json({ error: 'Shop not found' });
      return;
    }
    
    await shopRepository.delete(id);
    res.status(204).send();
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error('Error deleting shop:', { error: error.message });
    } else {
      logger.error('Error deleting shop:', { error: 'Unknown error' });
    }
    res.status(500).json({ error: 'Failed to delete shop' });
  }
});

export default router;