  import { Router } from 'express';
  import { getProfile, updateProfile, updateAvatar, updateDeviceInfo, getAllUsers, updateUserRole, deleteUser } from '../controllers/user.controller';
  import { verifyToken, checkAdmin } from '../middleware/auth.middleware';
  import { uploadAvatarMiddleware } from '../middleware/upload.middleware'; // Import middleware xử lý file

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
   *     summary: Cập nhật thông tin văn bản (Tên, Số điện thoại)
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
   *     responses:
   *       200:
   *         description: Cập nhật thành công
   *       400:
   *         description: Dữ liệu không hợp lệ
   *       401:
   *         description: Chưa xác thực
   */
  router.put('/profile', verifyToken, updateProfile);

  /**
   * @swagger
   * /api/v1/users/profile/avatar:
   *   patch:
   *     summary: Cập nhật ảnh đại diện (Upload trực tiếp file ảnh)
   *     tags:
   *       - Users
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               avatar:
   *                 type: string
   *                 format: binary
   *                 description: File ảnh (jpg, png, jpeg) được chọn từ thiết bị
   *     responses:
   *       200:
   *         description: Cập nhật ảnh đại diện thành công
   *       400:
   *         description: Thiếu file hoặc định dạng không hợp lệ
   *       401:
   *         description: Chưa xác thực
   *       500:
   *         description: Lỗi server hoặc lỗi Firebase
   */
  router.patch(
    '/profile/avatar',
    verifyToken,
    uploadAvatarMiddleware.single('avatar'),
    updateAvatar
  );

  router.post('/device', verifyToken, updateDeviceInfo);

  // ADMIN -----------------------------------------
  // Lấy danh sách toàn bộ users
  router.get('/', verifyToken, checkAdmin, getAllUsers);

  // Cập nhật quyền (role) của user
  router.patch('/:id/role', verifyToken, checkAdmin, updateUserRole);

  // Xóa tài khoản user
  router.delete('/:id', verifyToken, checkAdmin, deleteUser);

  export default router;