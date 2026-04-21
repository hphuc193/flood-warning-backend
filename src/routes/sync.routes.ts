import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware';
import { getOfflineDataSync, syncOfflineActions } from '../controllers/sync.controller';

const router = Router();

/**
 * @swagger
 * /api/v1/sync/offline-data:
 * get:
 * summary: Tải toàn bộ dữ liệu thiết yếu phục vụ chế độ Offline (Hive)
 * tags: [Sync]
 * security:
 * - bearerAuth: []
 */
router.get('/offline-data', verifyToken, getOfflineDataSync);

/**
 * @swagger
 * /api/v1/sync/offline-actions:
 * post:
 * summary: Đồng bộ đẩy dữ liệu từ Mobile lên Server sau khi có mạng lại
 * tags: [Sync]
 */
router.post('/offline-actions', verifyToken, syncOfflineActions);

export default router;