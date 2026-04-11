import cron from 'node-cron';
import moment from 'moment-timezone';
import User from '../models/User';
import UserSetting from '../models/UserSetting'; 
import { WeatherService } from '../services/weather.service';
import { sendPushNotification } from '../services/notification.service';

export const startWeatherCronJob = () => {
  // Chạy vào phút thứ 0 của mỗi giờ (Ví dụ: 6:00, 7:00, 8:00...)
  cron.schedule('0 * * * *', async () => {
    console.log('⏳ [Cron Job] Đang kiểm tra để gửi thông báo thời tiết buổi sáng...');

    try {
      // 1. Lấy tất cả user có bật thông báo thời tiết và có trạng thái active
      const users = await User.findAll({
        include: [{
          model: UserSetting,
          as: 'settings',
          where: { daily_weather_noti: true }
        }],
        where: { status: 'active' }
      });

      for (const user of users) {
        // Ép kiểu để lấy thông tin settings an toàn
        const settings = (user as any).settings;
        
        // Nếu user không có timezone, mặc định là giờ Việt Nam
        const tz = settings?.timezone || 'Asia/Ho_Chi_Minh';

        // 2. Kiểm tra xem ở múi giờ của user này, hiện tại có phải là 7h sáng không?
        const userCurrentHour = moment().tz(tz).hour();

        if (userCurrentHour === 7) {
          const lat = settings?.last_lat;
          const lon = settings?.last_long;

          if (lat && lon && user.fcm_token) {
            // 3. Gọi API thời tiết từ WeatherService
            const weatherData = await WeatherService.getDailyWeather(lat, lon, tz);
            
            // 4. Sinh nội dung thông minh
            const message = WeatherService.generateWeatherMessage(weatherData);

            // 5. GỬI PUSH NOTIFICATION (Đã sửa lại cách gọi hàm)
            await sendPushNotification(
              user.fcm_token,
              'Dự báo thời tiết hôm nay 🌦️',
              message
            );
            
            console.log(`✅ Đã gửi thông báo cho user ${user.email} (Timezone: ${tz})`);
          }
        }
      }
    } catch (error) {
      console.error('❌ Lỗi chạy Cron Job thời tiết:', error);
    }
  });
};