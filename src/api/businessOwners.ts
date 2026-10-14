import { Router, Request, Response } from 'express';
import { businessOwnerRepository, shopRepository } from '../db/postgres/repositories';
import { authenticate } from './middleware';
import logger from '../utils/logger';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * GET /api/business-owners
 * List all business owners
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const businessOwners = await businessOwnerRepository.findAll();
    res.json(businessOwners);
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error('Error fetching business owners:', { error: error.message });
    } else {
      logger.error('Error fetching business owners:', { error: 'Unknown error' });
    }
    res.status(500).json({ error: 'Failed to fetch business owners' });
  }
});

/**
 * GET /api/business-owners/:id
 * Get a specific business owner by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const businessOwner = await businessOwnerRepository.findById(id);
    
    if (!businessOwner) {
      res.status(404).json({ error: 'Business owner not found' });
      return;
    }
    
    res.json(businessOwner);
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error('Error fetching business owner:', { error: error.message });
    } else {
      logger.error('Error fetching business owner:', { error: 'Unknown error' });
    }
    res.status(500).json({ error: 'Failed to fetch business owner' });
  }
});

/**
 * POST /api/business-owners
 * Create a new business owner
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, email } = req.body;
    
    // Validate required fields
    if (!name || !email) {
      res.status(400).json({ error: 'Name and email are required' });
      return;
    }
    
    // Check if business owner with this email already exists
    const existingOwner = await businessOwnerRepository.findByEmail(email);
    if (existingOwner) {
      res.status(409).json({ error: 'Business owner with this email already exists' });
      return;
    }
    
    const businessOwner = await businessOwnerRepository.create({
      name,
      email,
    });
    
    res.status(201).json(businessOwner);
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error('Error creating business owner:', { error: error.message });
    } else {
      logger.error('Error creating business owner:', { error: 'Unknown error' });
    }
    res.status(500).json({ error: 'Failed to create business owner' });
  }
});

/**
 * PUT /api/business-owners/:id
 * Update a business owner
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;
    
    // Validate business owner exists
    const existingOwner = await businessOwnerRepository.findById(id);
    if (!existingOwner) {
      res.status(404).json({ error: 'Business owner not found' });
      return;
    }
    
    // If email is being updated, check for conflicts
    if (email && email !== existingOwner.email) {
      const ownerWithSameEmail = await businessOwnerRepository.findByEmail(email);
      if (ownerWithSameEmail) {
        res.status(409).json({ error: 'Business owner with this email already exists' });
        return;
      }
    }
    
    const businessOwner = await businessOwnerRepository.update(id, {
      name: name || existingOwner.name,
      email: email || existingOwner.email,
    });
    
    res.json(businessOwner);
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error('Error updating business owner:', { error: error.message });
    } else {
      logger.error('Error updating business owner:', { error: 'Unknown error' });
    }
    res.status(500).json({ error: 'Failed to update business owner' });
  }
});

/**
 * DELETE /api/business-owners/:id
 * Delete a business owner
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Validate business owner exists
    const existingOwner = await businessOwnerRepository.findById(id);
    if (!existingOwner) {
      res.status(404).json({ error: 'Business owner not found' });
      return;
    }
    
    // Check if business owner has shops
    const shops = await shopRepository.findByBusinessOwnerId(id);
    if (shops.length > 0) {
      res.status(400).json({ error: 'Cannot delete business owner with existing shops' });
      return;
    }
    
    await businessOwnerRepository.delete(id);
    res.status(204).send();
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error('Error deleting business owner:', { error: error.message });
    } else {
      logger.error('Error deleting business owner:', { error: 'Unknown error' });
    }
    res.status(500).json({ error: 'Failed to delete business owner' });
  }
});

export default router;