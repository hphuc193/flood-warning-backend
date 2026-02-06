import { Router } from 'express';
import { loginWithFirebase } from '../controllers/auth.controller';

const router = Router();

// POST /api/v1/auth/firebase-login
router.post('/firebase-login', loginWithFirebase);

export default router;