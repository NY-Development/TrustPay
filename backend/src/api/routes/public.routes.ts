import { Router } from 'express';
import { getPublicStats } from '../controllers/public.controller';

const router = Router();

// No `authenticate` middleware — this is the public marketing surface
// (landing page, about page, auth screens' stats panel).
router.get('/stats', getPublicStats);

export default router;
