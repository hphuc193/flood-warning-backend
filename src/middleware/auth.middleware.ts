import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// Mở rộng kiểu Request của Express để chứa thông tin user
export interface AuthRequest extends Request {
  user?: any;
}

export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  // Lấy header Authorization: "Bearer <token>"
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để thực hiện chức năng này!' });
  }

  try {
    // Giải mã token bằng chìa khóa bí mật
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    req.user = decoded; // Lưu thông tin user (id, email) vào biến req
    next(); // Cho phép đi tiếp vào Controller
  } catch (error) {
    return res.status(403).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};

export const checkAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  // verifyToken đã chạy trước đó, nên req.user đã có dữ liệu
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Chưa đăng nhập!' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Bạn không có quyền Admin!' });
  }

  next(); // Nếu là admin thì cho qua
};