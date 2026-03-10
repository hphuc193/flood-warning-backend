import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware';
import { getChecklistData, syncChecklistProgress } from '../controllers/checklist.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Checklists
 *   description: API quản lý danh sách chuẩn bị & đồng bộ tiến độ Offline
 */

/**
 * @swagger
 * /api/v1/checklists:
 *   get:
 *     summary: Lấy danh sách mẫu và tiến độ của user (Để App lưu local)
 *     tags: [Checklists]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/', verifyToken, getChecklistData);

/**
 * @swagger
 * /api/v1/checklists/sync:
 *   post:
 *     summary: Đồng bộ tiến độ từ App lên Server
 *     tags: [Checklists]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - completed_items
 *             properties:
 *               completed_items:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["ess_1", "saf_2", "sto_4"]
 *     responses:
 *       200:
 *         description: Đồng bộ thành công
 */
router.post('/sync', verifyToken, syncChecklistProgress);

export default router;