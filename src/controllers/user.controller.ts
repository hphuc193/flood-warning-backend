import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import User from '../models/User';
import admin from 'firebase-admin'; // Khai báo Firebase Admin
import UserSetting from '../models/UserSetting';
import { Op } from 'sequelize';
// 1. Lấy thông tin cá nhân
export const getProfile = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;

    if (!userId) return res.status(401).json({ success: false, message: 'Không tìm thấy ID người dùng trong Token' });

    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });

    if (!user) return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });

    return res.status(200).json({ success: true, data: user });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// 2. Cập nhật thông tin cá nhân (Text: Tên, Số điện thoại) - Dùng JSON
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;

    if (!userId) return res.status(401).json({ success: false, message: 'Không tìm thấy ID người dùng trong Token' });

    const { full_name, phone_number } = req.body; // Bỏ avatar_url ra khỏi đây vì đã có API riêng

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });

    if (full_name !== undefined) user.full_name = full_name;
    if (phone_number !== undefined) user.phone_number = phone_number;

    await user.save();

    const userData = user.toJSON();
    delete userData.password;

    return res.status(200).json({ 
      success: true, 
      message: 'Cập nhật thông tin thành công',
      data: userData 
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// 3. Cập nhật ảnh đại diện (File Upload lên Firebase) - Dùng Multipart/form-data
export const updateAvatar = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    const file = req.file;

    if (!userId) return res.status(401).json({ success: false, message: 'Không tìm thấy ID người dùng' });
    if (!file) return res.status(400).json({ success: false, message: 'Vui lòng đính kèm file ảnh (avatar)' });

    // Lấy bucket Firebase Storage
    const bucket = admin.storage().bucket();

    // Đổi tên file để tránh trùng lặp
    const fileExt = file.originalname.split('.').pop();
    const fileName = `avatars/user_${userId}_${Date.now()}.${fileExt}`;
    const fileUpload = bucket.file(fileName);

    // Stream upload lên Firebase
    const blobStream = fileUpload.createWriteStream({
      metadata: { contentType: file.mimetype },
    });

    blobStream.on('error', (error) => {
      return res.status(500).json({ success: false, message: `Lỗi khi lưu ảnh lên Firebase: ${error.message}` });
    });

    blobStream.on('finish', async () => {
      // Cấu trúc Public URL của Firebase Storage
      const encodedFileName = encodeURIComponent(fileName);
      const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedFileName}?alt=media`;

      // Cập nhật Database
      await User.update({ avatar_url: publicUrl }, { where: { id: userId } });

      return res.status(200).json({
        success: true,
        message: 'Cập nhật ảnh đại diện thành công',
        data: { avatar_url: publicUrl },
      });
    });

    blobStream.end(file.buffer);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// API Cập nhật thiết bị và vị trí (Dùng cho Weather Cron Job & Push Notification)
export const updateDeviceInfo = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const user_id = authReq.user?.id;
    const { fcm_token, lat, long, timezone } = req.body;

    if (!user_id) return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });

    // 1. Cập nhật FCM Token vào bảng User để nhận Push Notification
    if (fcm_token) {
      await User.update({ fcm_token }, { where: { id: user_id } });
    }

    // 2. Lưu tọa độ và Timezone vào bảng UserSettings (Nếu chưa có thì tạo mới)
    await UserSetting.upsert({
      user_id: user_id,
      last_lat: lat ? parseFloat(lat) : null,
      last_long: long ? parseFloat(long) : null,
      timezone: timezone || 'Asia/Ho_Chi_Minh'
    });

    return res.status(200).json({ 
      success: true, 
      message: 'Đã cập nhật thông tin thiết bị và vị trí' 
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ADMIN -----------------------------------------------------------------------------------

// 1. [Admin] Lấy danh sách toàn bộ người dùng (Có phân trang và tìm kiếm)
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const offset = (page - 1) * limit;

    let whereClause: any = {};
    if (search) {
      whereClause = {
        [Op.or]: [
          { full_name: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
          { phone_number: { [Op.iLike]: `%${search}%` } }
        ]
      };
    }

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ['password'] }, // Tuyệt đối không trả về password
      limit: limit,
      offset: offset,
      order: [['created_at', 'DESC']]
    });

    const totalPages = Math.ceil(count / limit);

    return res.status(200).json({
      success: true,
      meta: {
        current_page: page,
        total_pages: totalPages,
        total_items: count,
        limit: limit
      },
      data: users
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// 2. [Admin] Cập nhật phân quyền người dùng (Cấp quyền Admin)
export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Quyền (role) không hợp lệ, chỉ chấp nhận "user" hoặc "admin"' });
    }

    const user = await User.findByPk(Number(id));
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    user.role = role;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `Đã cập nhật quyền của người dùng thành ${role.toUpperCase()}`
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// 3. [Admin] Xóa (hoặc Khóa) người dùng
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(Number(id));
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    // Xóa user (Hoặc bạn có thể dùng soft-delete bằng cách thêm cờ is_active = false)
    await user.destroy();

    return res.status(200).json({
      success: true,
      message: 'Đã xóa người dùng thành công'
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};