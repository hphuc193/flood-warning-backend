import { Request, Response } from 'express';
import WeatherData from '../models/WeatherData';
import Location from '../models/Location';
import socketService from '../services/socket.service';
import { WeatherService } from '../services/weather.service';

// 1. API: Nhận dữ liệu (Giả lập Sensor)
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

// 2. API: Lấy thời tiết hiện tại (OpenWeatherMap)
export const getCurrentWeather = async (req: Request, res: Response) => {
  try {
    const { lat, long } = req.query;

    if (!lat || !long) {
      return res.status(400).json({ success: false, message: 'Thiếu tọa độ lat, long' });
    }

    const current = await WeatherService.getCurrentWeather(
      parseFloat(lat as string), 
      parseFloat(long as string)
    );

    const data = {
      temp: current.main.temp,
      humidity: current.main.humidity,
      description: current.weather[0].description,
      icon: `https://openweathermap.org/img/wn/${current.weather[0].icon}@2x.png`,
      wind_speed: current.wind.speed,
      city: current.name,
      source: 'OpenWeatherMap'
    };

    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// 3. API: Lấy lịch sử (DB)
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

// 4. API: Lấy dự báo 5 ngày (Trả về chi tiết nguyên bản từ OpenWeatherMap)
export const getWeatherForecast = async (req: Request, res: Response) => {
  try {
    const { lat, long } = req.query;

    if (!lat || !long) {
      return res.status(400).json({ success: false, message: 'Thiếu tọa độ lat, long' });
    }

    // Gọi Service lấy toàn bộ dữ liệu thô từ OpenWeatherMap
    const rawData = await WeatherService.getForecast(
      parseFloat(lat as string), 
      parseFloat(long as string)
    );

    // Trả về trực tiếp dữ liệu gốc mà không qua xử lý gộp nhóm
    return res.status(200).json({ 
      success: true, 
      city: rawData.city, // Trả về toàn bộ object city (tên, tọa độ, timezone, bình minh, hoàng hôn...)
      count: rawData.cnt, // Thường là 40 (dữ liệu cho 5 ngày x 8 mốc/ngày)
      data: rawData.list  // Mảng chứa đầy đủ các thông tin: main, weather, clouds, wind, visibility, pop...
    });

  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};