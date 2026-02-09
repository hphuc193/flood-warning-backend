import { Request, Response } from 'express';
import WeatherData from '../models/WeatherData';
import Location from '../models/Location';
import socketService from '../services/socket.service';
import { WeatherService } from '../services/weather.service'; // <--- Import Service mới

// 1. API: Nhận dữ liệu (Dùng để giả lập/test cảnh báo ngập & Socket)
export const addWeatherData = async (req: Request, res: Response) => {
  try {
    const { location_id, temperature, humidity, rainfall, wind_speed } = req.body;

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

    // Bắn Socket để App nhận cảnh báo ngay lập tức
    socketService.emitToLocation(location_id, 'weather_update', {
        location_id,
        temperature,
        rainfall,
        recorded_at: new Date()
    });

    return res.status(201).json({ success: true, data });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// 2. API: Lấy thời tiết thật (Từ OpenWeatherMap)
// SỬA: Chuyển từ dùng location_id sang dùng lat/long
export const getCurrentWeather = async (req: Request, res: Response) => {
  try {
    const { lat, long } = req.query;

    // Nếu thiếu tọa độ, báo lỗi
    if (!lat || !long) {
      return res.status(400).json({ success: false, message: 'Thiếu tọa độ lat, long' });
    }

    // Gọi Service lấy dữ liệu thật
    const current = await WeatherService.getCurrentWeather(
      parseFloat(lat as string), 
      parseFloat(long as string)
    );

    // Format dữ liệu cho gọn gàng
    const data = {
      temp: current.main.temp,
      humidity: current.main.humidity,
      description: current.weather[0].description,
      icon: `https://openweathermap.org/img/wn/${current.weather[0].icon}@2x.png`,
      wind_speed: current.wind.speed,
      city: current.name,
      source: 'OpenWeatherMap' // Đánh dấu nguồn dữ liệu
    };

    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// 3. API: Lấy lịch sử (Giữ nguyên để xem log dữ liệu giả lập)
export const getWeatherHistory = async (req: Request, res: Response) => {
    try {
      const { location_id, limit } = req.query;

      if (!location_id) {
        return res.status(400).json({ success: false, message: 'Thiếu location_id' });
      }

      const id = parseInt(location_id as string);
      const limitNum = limit ? parseInt(limit as string) : 24;
  
      const history = await WeatherData.findAll({
        where: { location_id: id },
        order: [['recorded_at', 'DESC']],
        limit: limitNum
      });
  
      return res.status(200).json({ success: true, data: history });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  };