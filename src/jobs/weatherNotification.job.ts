import cron from 'node-cron';
import moment from 'moment-timezone';
import User from '../models/User';
import UserSetting from '../models/UserSetting'; 
import Notification from '../models/Notification';
import { WeatherService } from '../services/weather.service';
import { sendPushNotification } from '../services/notification.service';

export const startWeatherCronJob = () => {
  cron.schedule('0 * * * *', async () => {
    console.log('\n--- 🔍 BẮT ĐẦU CHẠY CRON JOB ---');

    try {
      const users = await User.findAll({
        include: [{
          model: UserSetting,
          as: 'settings',
        }],
        where: { status: 'active' }
      });

      if (users.length === 0) return;

      for (const user of users) {
        const settings = (user as any).settings;
        
        if (!settings || settings.daily_weather_noti !== true) continue;

        let tz = settings.timezone || 'Asia/Ho_Chi_Minh';
        if (!tz.includes('/')) tz = 'Asia/Ho_Chi_Minh';
        const userCurrentHour = moment().tz(tz).hour();

        // if (userCurrentHour === moment().tz(tz).hour()) {
        if (userCurrentHour === 7) {
          const lat = settings.last_lat;
          const lon = settings.last_long;
          const token = user.fcm_token;

          if (!lat || !lon || !token) continue;

          const weatherData = await WeatherService.getDailyWeather(lat, lon, tz);
          const message = WeatherService.generateWeatherMessage(weatherData);
          
          const success = await sendPushNotification(token, 'Dự báo thời tiết 🌦️', message);
          
          if (success) {
            console.log(`🚀 ĐÃ GỬI THÀNH CÔNG CHO ${user.email}`);

            // 🌟 LƯU VÀO TRUNG TÂM THÔNG BÁO (NOTIFICATION CENTER) 🌟
            await Notification.create({
              user_id: user.id,
              title: 'Dự báo thời tiết hằng ngày',
              body: message,
              type: 'WEATHER',
              is_read: false
            });
          }
        }
      }
      console.log('--- 🛑 KẾT THÚC CRON JOB ---\n');
    } catch (error) {
      console.error('❌ Lỗi chạy Cron Job thời tiết:', error);
    }
  });
};