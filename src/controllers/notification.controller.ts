import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import Notification from '../models/Notification';

// 1. Lấy danh sách thông báo của User (Có phân trang)
export const getMyNotifications = async (req: Request, res: Response) => {
  try {
    const user_id = (req as AuthRequest).user?.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 15;
    const offset = (page - 1) * limit;

    if (!user_id) return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });

    const { count, rows: notifications } = await Notification.findAndCountAll({
      where: { user_id: user_id },
      limit: limit,
      offset: offset,
      order: [['created_at', 'DESC']] // Mới nhất lên đầu
    });

    // Đếm số thông báo chưa đọc
    const unreadCount = await Notification.count({
      where: { user_id: user_id, is_read: false }
    });

    const totalPages = Math.ceil(count / limit);

    return res.status(200).json({
      success: true,
      meta: {
        current_page: page,
        total_pages: totalPages,
        total_items: count,
        unread_count: unreadCount // Trả về số lượng chưa đọc để Mobile hiện "chấm đỏ"
      },
      data: notifications
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// 2. Đánh dấu 1 thông báo là đã đọc
export const markAsRead = async (req: Request, res: Response) => {
  try {
    const user_id = (req as AuthRequest).user?.id;
    const { id } = req.params;

    const notification = await Notification.findOne({ where: { id: id, user_id: user_id } });
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thông báo' });
    }

    notification.is_read = true;
    await notification.save();

    return res.status(200).json({ success: true, message: 'Đã đánh dấu đọc', data: notification });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// 3. Đánh dấu TẤT CẢ thông báo là đã đọc (Chức năng "Read all")
export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const user_id = (req as AuthRequest).user?.id;

    await Notification.update(
      { is_read: true },
      { where: { user_id: user_id, is_read: false } }
    );

    return res.status(200).json({ success: true, message: 'Đã đánh dấu đọc tất cả' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};