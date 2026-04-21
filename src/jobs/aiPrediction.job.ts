import cron from 'node-cron';
import axios from 'axios';
import Location from '../models/Location';
import User from '../models/User';
import Notification from '../models/Notification';
import { WeatherService } from '../services/weather.service';
import { sendPushNotification } from '../services/notification.service';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000/api/ai/predict';

export const startAIPredictionJob = () => {
  cron.schedule('0 * * * *', async () => {
    console.log('🤖 [AI Job] Bắt đầu thu thập Data thực tế và gọi AI Service...');
    
    try {
      const locations = await Location.findAll({ where: { type: 'station' } });

      for (const loc of locations) {
        try {
          const lat = loc.coordinates.coordinates[1];
          const long = loc.coordinates.coordinates[0];

          const weatherData = await WeatherService.getCurrentWeather(lat, long);
          const currentRainfall = weatherData.rain ? (weatherData.rain['1h'] || 0) : 0;
          const currentWaterLevel = 0.5 + (currentRainfall * 0.02);

          const payload = {
            location_id: loc.id,
            current_rainfall: currentRainfall,
            current_water_level: currentWaterLevel,
            weather_forecast: [] 
          };

          const response = await axios.post(AI_SERVICE_URL, payload);
          const highestRisk = response.data.current_highest_risk;
          
          console.log(`✅ AI Dự báo thành công cho trạm [${loc.name}]. Rủi ro: ${highestRisk.risk_level} (${highestRisk.risk_score}%)`);

          // 🌟 CHỈ GỬI VÀ LƯU THÔNG BÁO NẾU RỦI RO LÀ HIGH HOẶC EMERGENCY 🌟
          if (highestRisk.risk_level === 'HIGH' || highestRisk.risk_level === 'EMERGENCY') {
            const warningTitle = `⚠️ CẢNH BÁO LŨ LỤT (${highestRisk.risk_level})`;
            const warningMessage = `Phát hiện nguy cơ ngập lụt ${highestRisk.risk_score}% tại trạm ${loc.name}. Đỉnh lũ dự kiến lúc ${new Date(highestRisk.t_peak).toLocaleTimeString()}. Vui lòng chuẩn bị ứng phó!`;

            // 1. Tìm tất cả User để bắn Firebase Push
            const users = await User.findAll({ where: { status: 'active' } }); // Thực tế nên lọc user gần trạm
            
            for (const user of users) {
              if (user.fcm_token) {
                // Gửi Push Notification
                await sendPushNotification(user.fcm_token, warningTitle, warningMessage);
              }

              // 2. Lưu vào Trung tâm thông báo (Cho dù có Token hay không)
              await Notification.create({
                user_id: user.id,
                title: warningTitle,
                body: warningMessage,
                type: 'SYSTEM', // Hoặc 'AI_WARNING'
                is_read: false
              });
            }
          }
          
        } catch (err: any) {
          console.error(`❌ Lỗi khi dự báo cho trạm ${loc.name}:`, err.message);
        }
      }
    } catch (error: any) {
      console.error('❌ Lỗi tổng Cron Job AI:', error.message);
    }
  });
};