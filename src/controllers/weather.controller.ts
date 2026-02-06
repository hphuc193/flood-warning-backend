import { Request, Response } from 'express';
import WeatherData from '../models/WeatherData';
import Location from '../models/Location';
import socketService from '../services/socket.service';

// 1. API: Nhận dữ liệu từ Sensor hoặc Job đồng bộ
export const addWeatherData = async (req: Request, res: Response) => {
  try {
    const { location_id, temperature, humidity, rainfall, wind_speed } = req.body;

    // Kiểm tra xem địa điểm có tồn tại không
    const location = await Location.findByPk(location_id);
    if (!location) {
      return res.status(404).json({ success: false, message: 'Địa điểm không tồn tại' });
    }

    const data = await WeatherData.create({
      location_id,
      temperature,
      humidity,
      rainfall,
      wind_speed
    });

    console.log(`🔥 [DEBUG] Chuẩn bị bắn Socket cho Location ID: ${location_id}`);

    socketService.emitToLocation(location_id, 'weather_update', {
        location_id,
        temperature,
        rainfall,
        recorded_at: new Date()
    });

    console.log(`✅ [DEBUG] Đã bắn xong Socket!`);

    return res.status(201).json({ success: true, data });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// 2. API: Lấy thời tiết mới nhất của một địa điểm
export const getCurrentWeather = async (req: Request, res: Response) => {
  try {
    const { location_id } = req.query;

    if (!location_id) {
      return res.status(400).json({ success: false, message: 'Thiếu location_id' });
    }

    // --- FIX: Ép kiểu string sang number ---
    const id = parseInt(location_id as string); 

    const current = await WeatherData.findOne({
      where: { location_id: id }, // Truyền số đã parse vào đây
      order: [['recorded_at', 'DESC']],
      include: [{ model: Location, as: 'location', attributes: ['name'] }]
    });

    if (!current) {
      return res.status(404).json({ success: false, message: 'Chưa có dữ liệu thời tiết cho khu vực này' });
    }

    return res.status(200).json({ success: true, data: current });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// 3. API: Lấy lịch sử (để vẽ biểu đồ)
export const getWeatherHistory = async (req: Request, res: Response) => {
    try {
      const { location_id, limit } = req.query;

      if (!location_id) {
        return res.status(400).json({ success: false, message: 'Thiếu location_id' });
      }

      // --- FIX: Ép kiểu cho cả location_id và limit ---
      const id = parseInt(location_id as string);
      const limitNum = limit ? parseInt(limit as string) : 24;
  
      const history = await WeatherData.findAll({
        where: { location_id: id }, // Truyền số đã parse vào đây
        order: [['recorded_at', 'DESC']],
        limit: limitNum
      });
  
      return res.status(200).json({ success: true, data: history });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  };