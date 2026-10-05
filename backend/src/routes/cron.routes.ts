import express from 'express';
import { sendMonthlyReport } from '../controllers/cron.controller';
import { errorHandler } from '../middleware/error.middleware';

const router = express.Router();

// Not behind the panel login: the scheduler authenticates with CRON_SECRET inside the handler.
router.get('/monthly-report', sendMonthlyReport);

router.use(errorHandler);

export default router;
