import cron from 'node-cron';
import axios from 'axios';
import Location from '../models/Location';
import { WeatherService } from '../services/weather.service';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000/api/ai/predict';

export const startAIPredictionJob = () => {
  // Chạy mỗi giờ một lần (lúc phút thứ 0)
  cron.schedule('0 * * * *', async () => {
    console.log('🤖 [AI Job] Bắt đầu thu thập Data thực tế và gọi AI Service...');
    
    try {
      // 1. Lấy tất cả các trạm đo/khu vực cấu hình trong hệ thống
      const locations = await Location.findAll({ where: { type: 'station' } });

      for (const loc of locations) {
        try {
          // 2. Lấy dữ liệu THỜI TIẾT THỰC TẾ từ OpenWeatherMap
          const lat = loc.coordinates.coordinates[1];
          const long = loc.coordinates.coordinates[0];

          const weatherData = await WeatherService.getCurrentWeather(lat, long);
          
          // Trích xuất lượng mưa trong 1 giờ qua (nếu trời không mưa, object rain sẽ undefined)
          const currentRainfall = weatherData.rain ? (weatherData.rain['1h'] || 0) : 0;
          
          // Giả lập logic thủy văn cho mực nước (mưa càng to nước càng lên)
          // Thực tế: Lấy từ Cảm biến IoT
          const currentWaterLevel = 0.5 + (currentRainfall * 0.02);

          // 3. Chuẩn bị Payload đẩy sang Python
          const payload = {
            location_id: loc.id,
            current_rainfall: currentRainfall,
            current_water_level: currentWaterLevel,
            weather_forecast: [] // Tương lai có thể nhét array dự báo mưa 24h vào đây
          };

          // 4. Bắn HTTP POST sang Python FastAPI
          const response = await axios.post(AI_SERVICE_URL, payload);
          
          console.log(`✅ AI Dự báo thành công cho trạm [${loc.name}]. Rủi ro: ${response.data.current_highest_risk.risk_level} (${response.data.current_highest_risk.risk_score}%)`);
          
        } catch (err: any) {
          console.error(`❌ Lỗi khi dự báo cho trạm ${loc.name}:`, err.message);
        }
      }
    } catch (error: any) {
      console.error('❌ Lỗi tổng Cron Job AI:', error.message);
    }
  });
};