import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { Op } from 'sequelize';
import Report from '../models/Report'; // Cảnh báo/Báo cáo cộng đồng
import SosAlert from '../models/SosAlert'; // Cảnh báo SOS
import UserChecklist from '../models/UserChecklist'; // Cấu trúc checklist của bạn
import EmergencyContact from '../models/EmergencyContact'; // Danh bạ khẩn cấp
import AIFloodPrediction from '../models/AIFloodPrediction'; // Dự báo AI

export const getOfflineDataSync = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const user_id = authReq.user?.id;

    if (!user_id) return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });

    // Lấy mốc thời gian 7 ngày trước
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Sử dụng Promise.all để lấy tất cả dữ liệu cùng một lúc (Tối ưu hiệu năng)
    const [
      recentReports,
      recentSosAlerts,
      userChecklists,
      emergencyContacts,
      latestForecast
    ] = await Promise.all([
      // 1. Lấy lịch sử cảnh báo 7 ngày qua
      Report.findAll({ 
        where: { createdAt: { [Op.gte]: sevenDaysAgo }, status: 'verified' },
        order: [['createdAt', 'DESC']]
      }),
      
      // 2. Lấy danh sách SOS 7 ngày qua
      SosAlert.findAll({
        where: { reported_at: { [Op.gte]: sevenDaysAgo } },
        order: [['reported_at', 'DESC']]
      }),

      // 3. Lấy checklist ứng phó của user này
      UserChecklist.findAll({ where: { user_id: user_id } }),

      // 4. Lấy danh bạ liên hệ khẩn cấp (thường là dữ liệu dùng chung)
      EmergencyContact.findAll({ order: [['name', 'ASC']] }),

      // 5. Lấy dự báo nguy cơ AI gần nhất
      AIFloodPrediction.findOne({
        order: [['predicted_at', 'DESC']]
      })
    ]);

    // Trả về một khối JSON duy nhất chứa toàn bộ dữ liệu
    return res.status(200).json({
      success: true,
      message: 'Đồng bộ dữ liệu ngoại tuyến thành công',
      data: {
        last_sync_time: new Date(),
        reports: recentReports,
        sos_alerts: recentSosAlerts,
        checklists: userChecklists,
        contacts: emergencyContacts,
        forecast: latestForecast
      }
    });

  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// [TÙY CHỌN NÂNG CAO] 
// API để Mobile đẩy các thay đổi checklist (khi offline) lên Server khi có mạng lại
export const syncOfflineActions = async (req: Request, res: Response) => {
  try {
    const user_id = (req as AuthRequest).user?.id;
    const { offline_checklist_updates } = req.body; 
    // Giả sử mobile gửi lên một mảng các checklist item đã tick lúc rớt mạng

    if (offline_checklist_updates && offline_checklist_updates.length > 0) {
      // Logic lặp qua mảng và update vào DB
      // ...
    }

    return res.status(200).json({ success: true, message: 'Đã đồng bộ thao tác ngoại tuyến' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};