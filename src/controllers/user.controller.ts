import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import User from '../models/User';
import admin from 'firebase-admin'; // Khai báo Firebase Admin

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