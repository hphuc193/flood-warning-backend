import { Request, Response } from 'express';
import { firebaseAuth } from '../config/firebase';
import User from '../models/User';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();
// 1. Đăng ký tài khoản (Native)
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, full_name } = req.body;

    // Validate cơ bản
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập email và mật khẩu' });
    }

    // Kiểm tra email đã tồn tại chưa
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email này đã được sử dụng' });
    }

    // Băm mật khẩu (Hashing)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Tạo User mới
    const newUser = await User.create({
      email,
      password: hashedPassword, // Lưu password đã băm
      full_name: full_name || 'New User',
      role: 'user',
      status: 'active',
      // firebase_uid để trống
    });

    // (Tùy chọn) Tạo luôn token để đăng nhập ngay sau khi đăng ký
    // ...

    return res.status(201).json({
      success: true,
      message: 'Đăng ký thành công',
      data: {
        id: newUser.id,
        email: newUser.email,
        full_name: newUser.full_name
      }
    });

  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
// 2. Đăng nhập (Native)
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Thiếu email hoặc mật khẩu' });
    }

    // Tìm user theo email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
    }

    // Nếu user này đăng nhập bằng Google (không có password)
    if (!user.password) {
      return res.status(400).json({ success: false, message: 'Tài khoản này dùng đăng nhập Google, vui lòng chọn Login with Google' });
    }

    // Kiểm tra mật khẩu (So sánh password nhập vào với password đã băm trong DB)
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
    }

    const secretKey = process.env.JWT_SECRET as string;

    // Tạo JWT Token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      secretKey, 
      { expiresIn: '7d' } 
    );

    return res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công',
      token, // Trả về token cho Client lưu
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        avatar_url: user.avatar_url
      }
    });

  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
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