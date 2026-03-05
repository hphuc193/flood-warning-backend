import { Router } from 'express';
import { getProfile, updateProfile } from '../controllers/user.controller';
import { verifyToken } from '../middleware/auth.middleware'; // Đã sửa tên middleware

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: API quản lý thông tin người dùng
 */

/**
 * @swagger
 * /api/v1/users/profile:
 *   get:
 *     summary: Lấy thông tin cá nhân của user đang đăng nhập
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 *       401:
 *         description: Chưa xác thực (Token không hợp lệ)
 */
router.get('/profile', verifyToken, getProfile);

/**
 * @swagger
 * /api/v1/users/profile:
 *   put:
 *     summary: Cập nhật thông tin cá nhân
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *                 example: Nguyễn Văn A
 *               phone_number:
 *                 type: string
 *                 example: "0901234567"
 *               avatar_url:
 *                 type: string
 *                 example: https://example.com/avatar.jpg
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Chưa xác thực
 */
router.put('/profile', verifyToken, updateProfile);

export default router;