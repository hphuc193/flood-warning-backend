import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware';
import { 
  createLocation, 
  getMyLocations, 
  updateLocation, 
  deleteLocation 
} from '../controllers/userLocation.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: User Locations
 *     description: API quản lý các vị trí quan tâm của người dùng
 */

/**
 * @swagger
 * /api/v1/user-locations:
 *   get:
 *     summary: Lấy danh sách vị trí đã lưu của người dùng
 *     tags: [User Locations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/', verifyToken, getMyLocations);

/**
 * @swagger
 * /api/v1/user-locations:
 *   post:
 *     summary: Lưu một vị trí quan tâm mới
 *     tags: [User Locations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - lat
 *               - long
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Nhà riêng"
 *               lat:
 *                 type: number
 *                 example: 10.762622
 *               long:
 *                 type: number
 *                 example: 106.660172
 *               radius:
 *                 type: number
 *                 example: 5
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 example: "high"
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
router.post('/', verifyToken, createLocation);

/**
 * @swagger
 * /api/v1/user-locations/{id}:
 *   put:
 *     summary: Cập nhật vị trí (VD đổi bán kính, bật/tắt thông báo)
 *     tags: [User Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của vị trí đã lưu
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Nhà trọ"
 *               radius:
 *                 type: number
 *                 example: 3
 *               is_active:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/:id', verifyToken, updateLocation);

/**
 * @swagger
 * /api/v1/user-locations/{id}:
 *   delete:
 *     summary: Xóa một vị trí đã lưu
 *     tags: [User Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete('/:id', verifyToken, deleteLocation);

export default router;