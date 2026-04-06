import { Router } from 'express';
import { login, loginWithFirebase, register, loginWithFacebook } from '../controllers/auth.controller';

const router = Router();

// POST /api/v1/auth/firebase-login
router.post('/firebase-login', loginWithFirebase);
router.post('/register', register);
router.post('/login', login);
router.post('/facebook-login', loginWithFacebook);

export default router;