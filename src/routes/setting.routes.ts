import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware';
import { getMySettings, updateMySettings } from '../controllers/setting.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: User Settings
 *     description: API quản lý cấu hình, cài đặt của người dùng
 */

/**
 * @swagger
 * /api/v1/settings:
 *   get:
 *     summary: Lấy cấu hình hiện tại của user (Tự động tạo mặc định nếu chưa có)
 *     tags: [User Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/', verifyToken, getMySettings);

/**
 * @swagger
 * /api/v1/settings:
 *   patch:
 *     summary: Cập nhật cài đặt của user (Chỉ cần truyền các trường muốn đổi)
 *     tags: [User Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               theme:
 *                 type: string
 *                 enum: [light, dark, system]
 *                 example: "dark"
 *               noti_push:
 *                 type: boolean
 *                 example: true
 *               daily_weather_noti:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.patch('/', verifyToken, updateMySettings);

export default router;