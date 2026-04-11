import cron from 'node-cron';
import moment from 'moment-timezone';
import User from '../models/User';
import UserSetting from '../models/UserSetting'; 
import { WeatherService } from '../services/weather.service';
import { sendPushNotification } from '../services/notification.service';

export const startWeatherCronJob = () => {
  cron.schedule('* * * * *', async () => {
    console.log('\n--- 🔍 BẮT ĐẦU CHẠY CRON JOB ---');

    try {
      // Bỏ điều kiện where settings để lấy TẤT CẢ user active ra kiểm tra
      const users = await User.findAll({
        include: [{
          model: UserSetting,
          as: 'settings',
        }],
        where: { status: 'active' }
      });

      console.log(`👥 Tìm thấy ${users.length} user có trạng thái active trên hệ thống.`);

      if (users.length === 0) return;

      for (const user of users) {
        console.log(`\n👤 Đang kiểm tra User: ${user.email}`);
        
        const settings = (user as any).settings;
        
        // 1. Kiểm tra Settings
        if (!settings) {
          console.log(`❌ LỖI: User này chưa có dữ liệu trong bảng user_settings (Chưa gọi API /device).`);
          continue;
        }

        if (settings.daily_weather_noti !== true) {
          console.log(`❌ LỖI: User này đã tắt thông báo thời tiết.`);
          continue;
        }

        const tz = settings.timezone || 'Asia/Ho_Chi_Minh';
        const userCurrentHour = moment().tz(tz).hour();

        console.log(`🕒 Timezone: ${tz} | Giờ hiện tại: ${userCurrentHour}`);

        // Hack test: Chạy ở giờ hiện tại
        if (userCurrentHour === moment().tz(tz).hour()) {
          const lat = settings.last_lat;
          const lon = settings.last_long;
          const token = user.fcm_token;

          console.log(`📍 Tọa độ: ${lat}, ${lon}`);
          console.log(`📱 FCM Token: ${token ? 'Đã có' : 'NULL'}`);

          // 2. Kiểm tra dữ liệu bắt buộc
          if (!lat || !lon) {
            console.log(`❌ LỖI: Thiếu tọa độ lat/lon.`);
            continue;
          }
          if (!token) {
            console.log(`❌ LỖI: Thiếu fcm_token.`);
            continue;
          }

          // 3. Nếu qua hết các ải, tiến hành gửi
          console.log(`✅ Đủ điều kiện! Đang gọi API thời tiết...`);
          const weatherData = await WeatherService.getDailyWeather(lat, lon, tz);
          const message = WeatherService.generateWeatherMessage(weatherData);

          console.log(`✉️ Nội dung gửi: ${message}`);
          
          const success = await sendPushNotification(token, 'Dự báo thời tiết 🌦️', message);
          
          if (success) {
            console.log(`🚀 ĐÃ GỬI THÀNH CÔNG CHO ${user.email}`);
          } else {
            console.log(`⚠️ Gửi thất bại từ Firebase (Token có thể hết hạn hoặc sai)`);
          }
        }
      }
      console.log('--- 🛑 KẾT THÚC CRON JOB ---\n');
    } catch (error) {
      console.error('❌ Lỗi chạy Cron Job thời tiết:', error);
    }
  });
};