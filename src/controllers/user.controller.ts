import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import User from '../models/User';

// 1. Lấy thông tin cá nhân
export const getProfile = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Không tìm thấy ID người dùng trong Token' });
    }

    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] } // Giấu password đi
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
    }

    return res.status(200).json({ success: true, data: user });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// 2. Cập nhật thông tin cá nhân
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Không tìm thấy ID người dùng trong Token' });
    }

    // Nhận đúng tên biến từ body khớp với Model User
    const { full_name, phone_number, avatar_url } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
    }

    // Cập nhật dữ liệu
    if (full_name !== undefined) user.full_name = full_name;
    if (phone_number !== undefined) user.phone_number = phone_number;
    if (avatar_url !== undefined) user.avatar_url = avatar_url;

    await user.save();

    // Clone data và xóa password trước khi trả về
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