import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import SosTemplate from '../models/SosTemplate';
import SosAlert from '../models/SosAlert';
import { Op } from 'sequelize';
import { io } from '../server';
import User from '../models/User';

SosAlert.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// 1. API: Lưu cấu hình nội dung SOS mặc định
export const saveSosTemplate = async (req: Request, res: Response) => {
  try {
    const user_id = (req as AuthRequest).user?.id;
    const { default_description } = req.body;

    const [template, created] = await SosTemplate.upsert({
      user_id: user_id as number,
      default_description
    });

    return res.status(200).json({ success: true, message: 'Đã lưu cấu hình SOS', data: template });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// 2. API: Nhận tín hiệu SOS trực tiếp qua Internet (Trường hợp 1 & 3)
export const sendSosOnline = async (req: Request, res: Response) => {
  try {
    const user_id = (req as AuthRequest).user?.id;
    const { lat, long, emergency_type, description, timestamp } = req.body;

    const sos = await SosAlert.create({
      user_id: user_id as number,
      location: { type: 'Point', coordinates: [long, lat] }, // Chú ý: [Kinh độ, Vĩ độ]
      emergency_type,
      description,
      reported_at: timestamp ? new Date(timestamp) : new Date()
    });

    if (io) {
      io.emit('new_sos_alert', sos); // Kích hoạt chuông báo động trên Web Admin
    }

    return res.status(201).json({ success: true, message: 'Đã gửi tín hiệu SOS thành công', data: sos });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// 3. API: Webhook nhận SMS từ Gateway (Trường hợp 2)
// Cú pháp tin nhắn SMS: SOS|USER123|10.762622|106.660172|FLOOD|171234567
export const receiveSosSmsWebhook = async (req: Request, res: Response) => {
  try {
    // SMS Gateway thường bắn nội dung tin nhắn vào req.body.message hoặc req.body.text
    const smsContent = req.body.message || req.body.text; 
    
    if (!smsContent || !smsContent.startsWith('SOS|')) {
      return res.status(400).json({ success: false, message: 'Định dạng SMS không hợp lệ' });
    }

    const parts = smsContent.split('|');
    if (parts.length < 6) return res.status(400).json({ success: false, message: 'Thiếu dữ liệu' });

    const [, userIdStr, latStr, longStr, emergency_type, timestampStr] = parts;
    const user_id = parseInt(userIdStr.replace('USER', '')); // Lọc lấy số ID
    const lat = parseFloat(latStr);
    const long = parseFloat(longStr);
    
    // Lấy thông tin mô tả mặc định của User này từ DB
    const template = await SosTemplate.findOne({ where: { user_id } });
    const description = template ? template.default_description : 'SOS khẩn cấp qua SMS';

    // Lưu vào hệ thống
    const sos = await SosAlert.create({
      user_id,
      location: { type: 'Point', coordinates: [long, lat] },
      emergency_type,
      description,
      reported_at: new Date(parseInt(timestampStr))
    });

    // Trả về 200 OK để SMS Gateway biết là đã nhận thành công
    return res.status(200).json({ success: true, message: 'Đã nhận và xử lý SMS SOS' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// 🛡️ ADMIN APIs: QUẢN LÝ SOS & BẢN ĐỒ

// 1. [Admin] Lấy danh sách SOS để hiển thị lên BẢN ĐỒ (SOS Map)
// API này không phân trang, chỉ lấy các ca đang chờ hoặc đang xử lý để ghim lên bản đồ
export const getActiveSosForMap = async (req: Request, res: Response) => {
  try {
    const activeAlerts = await SosAlert.findAll({
      where: {
        status: { [Op.in]: ['pending', 'processing'] } // Chỉ lấy ca chưa giải quyết xong
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'full_name', 'phone_number', 'avatar_url']
      }],
      order: [['reported_at', 'DESC']]
    });

    // Format lại dữ liệu tọa độ PostGIS cho Frontend dễ dùng (Bản đồ thường cần lat, lng rõ ràng)
    const formattedData = activeAlerts.map(alert => {
      const alertJson = alert.toJSON();
      return {
        ...alertJson,
        // PostGIS trả về { type: 'Point', coordinates: [long, lat] }
        lat: alertJson.location.coordinates[1],
        long: alertJson.location.coordinates[0],
      };
    });

    return res.status(200).json({ success: true, count: formattedData.length, data: formattedData });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// 2. [Admin] Lấy danh sách SOS cho Bảng quản lý (Có phân trang, lọc status)
export const getAllSosAlerts = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const emergency_type = req.query.emergency_type as string;
    
    const offset = (page - 1) * limit;
    let whereClause: any = {};

    if (status) whereClause.status = status;
    if (emergency_type) whereClause.emergency_type = emergency_type;

    const { count, rows: alerts } = await SosAlert.findAndCountAll({
      where: whereClause,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'full_name', 'phone_number']
      }],
      limit: limit,
      offset: offset,
      order: [['reported_at', 'DESC']]
    });

    // Format lại tọa độ như hàm trên
    const formattedData = alerts.map(alert => {
      const alertJson = alert.toJSON();
      return {
        ...alertJson,
        lat: alertJson.location.coordinates[1],
        long: alertJson.location.coordinates[0],
      };
    });

    const totalPages = Math.ceil(count / limit);

    return res.status(200).json({
      success: true,
      meta: { current_page: page, total_pages: totalPages, total_items: count, limit },
      data: formattedData
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// 3. [Admin] Cập nhật trạng thái SOS (VD: Điều xe cứu hộ -> 'processing' -> Cứu xong -> 'resolved')
export const updateSosStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'processing', 'resolved'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái SOS không hợp lệ' });
    }

    const alert = await SosAlert.findByPk(Number(id));
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tín hiệu SOS' });
    }

    alert.status = status;
    await alert.save();

    // Bắn realtime Socket.IO để bản đồ tự động đổi màu icon (Ví dụ: Đỏ -> Vàng -> Xanh)
    if (io) {
      io.emit('sos_status_updated', { id: alert.id, status: alert.status });
    }

    return res.status(200).json({ success: true, message: `Đã cập nhật trạng thái thành ${status}`, data: alert });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// 4. [Admin] Xóa tín hiệu SOS (Dành cho các trường hợp test hoặc báo cáo giả)
export const deleteSosAlert = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const alert = await SosAlert.findByPk(Number(id));
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tín hiệu SOS' });
    }

    await alert.destroy();

    // Báo cho bản đồ xóa điểm này đi
    if (io) {
      io.emit('sos_deleted', { id: Number(id) });
    }

    return res.status(200).json({ success: true, message: 'Đã xóa tín hiệu SOS' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};