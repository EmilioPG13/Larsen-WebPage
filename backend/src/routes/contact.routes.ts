import express from 'express';
import { createContactSubmission } from '../controllers/leads.controller';
import { errorHandler } from '../middleware/error.middleware';

const router = express.Router();

// Public route
router.post('/', createContactSubmission);

router.use(errorHandler);

export default router;


