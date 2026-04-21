import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware';
import { 
  getMyNotifications, 
  markAsRead, 
  markAllAsRead 
} from '../controllers/notification.controller';

const router = Router();

router.get('/', verifyToken, getMyNotifications);
router.patch('/read-all', verifyToken, markAllAsRead); // Lưu ý: route này phải đặt trước /:id/read
router.patch('/:id/read', verifyToken, markAsRead);

export default router;