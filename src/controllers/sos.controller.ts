import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import SosTemplate from '../models/SosTemplate';
import SosAlert from '../models/SosAlert';

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

    // TODO: Bắn Socket.IO hoặc Notification cho Admin Dashboard tại đây

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