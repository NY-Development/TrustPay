import { Router } from 'express';
import { submitContactRequest } from '../controllers/contact.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// Submit a contact request
router.post('/', authenticate, submitContactRequest);

export default router;
