import express from 'express';
import { getCatalog } from '../controllers/catalog.controller';
import { errorHandler } from '../middleware/error.middleware';

const router = express.Router();

// Public: the website reads the live stock from here.
router.get('/', getCatalog);

router.use(errorHandler);

export default router;
