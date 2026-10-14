import { Router } from 'express';
import businessOwnersRouter from './businessOwners';
import shopsRouter from './shops';
import settingsRouter from './settings';
import knowledgeSourcesRouter from './knowledgeSources';

const router = Router();

// Mount all API routes
router.use('/business-owners', businessOwnersRouter);
router.use('/shops', shopsRouter);
router.use('/shops', settingsRouter);
router.use('/', knowledgeSourcesRouter);

export default router;