import { Request, Response } from 'express';
import Alert from '../models/Alert';
import Location from '../models/Location';
import { sendAlertNotification } from '../services/notification.service';

// 1. Tạo cảnh báo mới
export const createAlert = async (req: Request, res: Response) => {
  try {
    const { location_id, title, description, severity, affected_radius } = req.body;

    const location = await Location.findByPk(location_id);
    if (!location) {
      return res.status(404).json({ success: false, message: 'Địa điểm không tồn tại' });
    }

    const newAlert = await Alert.create({
      location_id,
      title,
      description,
      severity,
      affected_radius: affected_radius || 1000,
      status: 'active'
    });

    // --- MỚI THÊM: Gửi thông báo đẩy ngay lập tức ---
    // Không dùng await để tránh client phải đợi lâu, cho chạy ngầm (Fire & Forget)
    sendAlertNotification(newAlert); 
    // ------------------------------------------------

    return res.status(201).json({ success: true, data: newAlert });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// 2. Lấy danh sách cảnh báo đang hoạt động (Active)
export const getActiveAlerts = async (req: Request, res: Response) => {
  try {
    const alerts = await Alert.findAll({
      where: { status: 'active' },
      include: [
        { 
          model: Location, 
          as: 'location',
          // FIX: Bỏ 'lat', 'long' đi vì bảng Locations không có 2 cột này
          // Dữ liệu tọa độ đã nằm trong 'coordinates'
          attributes: ['name', 'coordinates'] 
        }
      ],
      order: [['started_at', 'DESC']]
    });

    return res.status(200).json({ success: true, count: alerts.length, data: alerts });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// 3. Giải quyết cảnh báo (Tắt cảnh báo)
export const resolveAlert = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        // --- FIX: Thêm 'as string' để ép kiểu ---
        const alert = await Alert.findByPk(id as string);

        if(!alert) return res.status(404).json({success: false, message: 'Không tìm thấy cảnh báo'});

        await alert.update({
            status: 'resolved',
            ended_at: new Date()
        });

        return res.status(200).json({success: true, message: 'Đã đóng cảnh báo', data: alert});
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message });
    }
}