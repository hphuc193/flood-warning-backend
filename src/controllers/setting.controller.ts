import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import UserSetting from '../models/UserSetting';

// 1. Lấy thông tin Cài đặt của User hiện tại
export const getMySettings = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const user_id = authReq.user?.id;

    if (!user_id) return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });

    // Dùng findOrCreate: Nếu user chưa có setting, hệ thống tự tạo 1 bản ghi mặc định
    const [settings, created] = await UserSetting.findOrCreate({
      where: { user_id: user_id },
      defaults: {
        user_id: user_id,
        theme: 'system',
        noti_push: true,
        noti_sms: false,
        noti_email: false,
        daily_weather_noti: true,
        timezone: 'Asia/Ho_Chi_Minh'
      }
    });

    return res.status(200).json({ success: true, data: settings });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// 2. Cập nhật thông tin Cài đặt
export const updateMySettings = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const user_id = authReq.user?.id;

    if (!user_id) return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });

    // Lấy các trường người dùng muốn cập nhật từ Body (Cho phép cập nhật từng phần - Partial update)
    const { 
      theme, 
      noti_push, 
      noti_sms, 
      noti_email, 
      daily_weather_noti,
      timezone 
    } = req.body;

    // Tìm setting hiện tại
    let settings = await UserSetting.findOne({ where: { user_id } });

    if (!settings) {
      // Nếu chưa có thì tạo mới với các thông số truyền vào (kết hợp mặc định)
      settings = await UserSetting.create({
        user_id,
        theme: theme || 'system',
        noti_push: noti_push ?? true,
        noti_sms: noti_sms ?? false,
        noti_email: noti_email ?? false,
        daily_weather_noti: daily_weather_noti ?? true,
        timezone: timezone || 'Asia/Ho_Chi_Minh'
      });
    } else {
      // Nếu đã có thì cập nhật những trường được truyền lên
      if (theme !== undefined) settings.theme = theme;
      if (noti_push !== undefined) settings.noti_push = noti_push;
      if (noti_sms !== undefined) settings.noti_sms = noti_sms;
      if (noti_email !== undefined) settings.noti_email = noti_email;
      if (daily_weather_noti !== undefined) settings.daily_weather_noti = daily_weather_noti;
      if (timezone !== undefined) settings.timezone = timezone;

      await settings.save();
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Cập nhật cài đặt thành công', 
      data: settings 
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};