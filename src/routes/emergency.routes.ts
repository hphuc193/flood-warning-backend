import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware';
import { getContacts, addCustomContact, deleteCustomContact } from '../controllers/emergency.controller';

const router = Router();

// Tất cả các API danh bạ đều cần đăng nhập
router.use(verifyToken);

/**
 * @swagger
 * tags:
 *   name: Emergency Contacts
 *   description: Quản lý danh bạ khẩn cấp (hệ thống và cá nhân)
 */

/**
 * @swagger
 * /api/v1/emergency-contacts:
 *   get:
 *     summary: Lấy danh bạ khẩn cấp (Hệ thống + Cá nhân)
 *     tags: [Emergency Contacts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/', getContacts);

/**
 * @swagger
 * /api/v1/emergency-contacts:
 *   post:
 *     summary: Thêm một số điện thoại người thân
 *     tags: [Emergency Contacts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Thêm thành công
 */
router.post('/', addCustomContact);

/**
 * @swagger
 * /api/v1/emergency-contacts/{id}:
 *   delete:
 *     summary: Xóa một số điện thoại người thân
 *     tags: [Emergency Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của contact cần xóa
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete('/:id', deleteCustomContact);

export default router;