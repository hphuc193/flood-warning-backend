import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware';
import { 
  getMyNotifications, 
  markAsRead, 
  markAllAsRead 
} from '../controllers/notification.controller';

const router = Router();

router.get('/', verifyToken, getMyNotifications);
router.patch('/:id/read', verifyToken, markAsRead);
router.patch('/read-all', verifyToken, markAllAsRead);
export default router;