import { Router } from 'express';
import { getEvacuationGuide } from '../controllers/evacuation.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Evacuation
 *   description: Hướng dẫn sơ tán an toàn
 */

/**
 * @swagger
 * /api/v1/evacuation/guide:
 *   get:
 *     summary: Lấy danh sách 7 bước hướng dẫn sơ tán (Hỗ trợ Offline Mode & Video)
 *     tags: [Evacuation]
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/guide', getEvacuationGuide);

export default router;