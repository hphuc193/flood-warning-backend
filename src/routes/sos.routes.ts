import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware';
import { 
  saveSosTemplate, 
  sendSosOnline, 
  receiveSosSmsWebhook 
} from '../controllers/sos.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: SOS
 *   description: Quản lý tín hiệu cứu trợ khẩn cấp
 */

/**
 * @swagger
 * /api/v1/sos/template:
 *   post:
 *     summary: Lưu cấu hình mô tả SOS mặc định của User
 *     tags: [SOS]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               default_description:
 *                 type: string
 *                 example: "Tôi bị tiểu đường, cần mang theo insulin. Nhóm máu O."
 *     responses:
 *       200:
 *         description: Thành công
 */
router.post('/template', verifyToken, saveSosTemplate);

/**
 * @swagger
 * /api/v1/sos/online:
 *   post:
 *     summary: Gửi tín hiệu SOS trực tiếp qua Internet (Trường hợp 1 & 3)
 *     tags: [SOS]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               lat:
 *                 type: number
 *                 example: 10.762622
 *               long:
 *                 type: number
 *                 example: 106.660172
 *               emergency_type:
 *                 type: string
 *                 example: "FLOOD"
 *               description:
 *                 type: string
 *                 example: "Nước đã ngập vào nhà 1 mét, có người già."
 *               timestamp:
 *                 type: string
 *                 example: "2026-03-16T04:00:00Z"
 *     responses:
 *       201:
 *         description: Đã gửi tín hiệu SOS thành công
 */
router.post('/online', verifyToken, sendSosOnline);

/**
 * @swagger
 * /api/v1/sos/webhook/sms:
 *   post:
 *     summary: Webhook nhận SMS SOS từ Gateway (Trường hợp 2)
 *     tags: [SOS]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: "SOS|USER123|10.762622|106.660172|FLOOD|171234567"
 *     responses:
 *       200:
 *         description: Đã nhận và xử lý SMS
 */
// Lưu ý: Route này không dùng verifyToken vì nó được gọi từ máy chủ SMS Gateway thứ 3
router.post('/webhook/sms', receiveSosSmsWebhook);

export default router;