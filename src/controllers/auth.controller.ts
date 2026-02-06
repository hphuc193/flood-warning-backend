import { Request, Response } from 'express';
import { firebaseAuth } from '../config/firebase';
import User from '../models/User';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// Hàm xử lý đăng nhập bằng Firebase
export const loginWithFirebase = async (req: Request, res: Response) => {
  try {
    // 1. Nhận ID Token từ Client (Flutter App gửi lên)
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Thiếu ID Token' });
    }

    // 2. Xác thực Token này với Firebase Server
    // (Bước này đảm bảo Token là thật, do Google cấp)
    const decodedToken = await firebaseAuth.verifyIdToken(token);
    const { uid, email, name, picture } = decodedToken;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Tài khoản không có email' });
    }

    // 3. Tìm xem User này đã có trong Database của mình chưa
    let user = await User.findOne({ where: { firebase_uid: uid } });

    // 4. Nếu chưa có (đăng nhập lần đầu) -> Tạo mới (Register)
    if (!user) {
      user = await User.create({
        firebase_uid: uid,
        email: email,
        full_name: name || 'Người dùng mới',
        avatar_url: picture || '',
        role: 'user', // Mặc định là user thường
        status: 'active'
      });
      console.log('✨ Đã tạo User mới:', email);
    } else {
      // Nếu đã có -> Cập nhật thông tin mới nhất từ Google (tùy chọn)
      user.update({
        full_name: name || user.full_name,
        avatar_url: picture || user.avatar_url
      });
    }

    // 5. Tạo JWT (Access Token) riêng của hệ thống mình
    // Token này dùng để gọi các API khác (như báo cáo lũ, xem cảnh báo...)
    const accessToken = jwt.sign(
      { 
        id: user.id, 
        role: user.role, 
        email: user.email 
      },
      process.env.JWT_SECRET as string,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
    );

    // 6. Trả kết quả về cho Client
    return res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        access_token: accessToken,
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          role: user.role,
          avatar: user.avatar_url
        }
      }
    });

  } catch (error: any) {
    console.error('Login Error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Xác thực thất bại',
      error: error.message
    });
  }
};