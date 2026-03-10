import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import UserChecklist from '../models/UserChecklist';

// Master Data: Danh sách checklist mặc định được cấu trúc sẵn
const MASTER_CHECKLIST = [
  {
    category: 'essential',
    category_name: 'CẦN THIẾT',
    items: [
      { id: 'ess_1', title: 'Giấy tờ quan trọng (cho vào túi chống nước)', is_important: true },
      { id: 'ess_2', title: 'Tiền mặt', is_important: true },
      { id: 'ess_3', title: 'Thuốc men cá nhân', is_important: true },
      { id: 'ess_4', title: 'Điện thoại & Sạc dự phòng (đã sạc đầy)', is_important: true },
    ]
  },
  {
    category: 'safety',
    category_name: 'AN TOÀN',
    items: [
      { id: 'saf_1', title: 'Di chuyển tài sản lên cao', is_important: false },
      { id: 'saf_2', title: 'Ngắt cầu dao điện & van gas', is_important: true },
      { id: 'saf_3', title: 'Khóa chặt cửa sổ, cửa chính', is_important: false },
    ]
  },
  {
    category: 'stockpile',
    category_name: 'DỰ TRỮ',
    items: [
      { id: 'sto_1', title: 'Đồ ăn khô (lương khô, mì tôm, bánh)', is_important: false },
      { id: 'sto_2', title: 'Nước uống sạch (ít nhất 3 ngày)', is_important: true },
      { id: 'sto_3', title: 'Áo ấm, áo mưa', is_important: false },
      { id: 'sto_4', title: 'Đèn pin & pin dự phòng', is_important: true },
    ]
  },
  {
    category: 'information',
    category_name: 'THÔNG TIN',
    items: [
      { id: 'inf_1', title: 'Lưu số điện thoại khẩn cấp (Cứu hộ, Y tế)', is_important: true },
      { id: 'inf_2', title: 'Ghi chú địa chỉ nơi trú ẩn an toàn', is_important: false },
      { id: 'inf_3', title: 'Tải bản đồ đường đi offline', is_important: false },
    ]
  }
];

// 1. Lấy Master Data & Tiến độ hiện tại
export const getChecklistData = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const user_id = authReq.user?.id;

    // Tìm tiến độ của user, nếu chưa có thì tạo mới với mảng rỗng
    const [userProgress] = await UserChecklist.findOrCreate({
      where: { user_id },
      defaults: { user_id, completed_items: [] }
    });

    return res.status(200).json({
      success: true,
      data: {
        master_list: MASTER_CHECKLIST,
        completed_items: userProgress.completed_items // Mảng chứa các ID như ['ess_1', 'saf_2']
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// 2. Đồng bộ tiến độ từ App (Offline to Online)
export const syncChecklistProgress = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const user_id = authReq.user?.id;
    const { completed_items } = req.body; // App gửi lên mảng ID mới nhất

    if (!Array.isArray(completed_items)) {
      return res.status(400).json({ success: false, message: 'completed_items phải là một mảng' });
    }

    const [userProgress] = await UserChecklist.findOrCreate({
      where: { user_id },
      defaults: { user_id, completed_items: [] }
    });

    // Cập nhật mảng mới từ App
    userProgress.completed_items = completed_items;
    await userProgress.save();

    return res.status(200).json({ 
      success: true, 
      message: 'Đồng bộ tiến độ thành công',
      data: userProgress.completed_items
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};