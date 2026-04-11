import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

export const WeatherService = {
  // 1. Lấy thời tiết hiện tại theo tọa độ (lat, long)
  getCurrentWeather: async (lat: number, lon: number) => {
    try {
      const response = await axios.get(`${BASE_URL}/weather`, {
        params: {
          lat,
          lon,
          appid: API_KEY,
          units: 'metric', // Độ C
          lang: 'vi'       // Tiếng Việt
        }
      });
      return response.data;
    } catch (error) {
      console.error('Weather API Error:', error);
      throw new Error('Không thể lấy dữ liệu thời tiết từ OpenWeatherMap');
    }
  },

  // 2. Lấy dự báo 5 ngày tới
  getForecast: async (lat: number, lon: number) => {
    try {
      const response = await axios.get(`${BASE_URL}/forecast`, {
        params: {
          lat,
          lon,
          appid: API_KEY,
          units: 'metric',
          lang: 'vi'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Forecast API Error:', error);
      throw new Error('Không thể lấy dữ liệu dự báo thời tiết');
    }
  },

  // 3. Lấy dữ liệu mưa lịch sử từ Open-Meteo
  getHistoricalRainfall: async (lat: number, long: number, days: number) => {
    try {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() - 3); 
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - days);

      const formatYMD = (date: Date) => date.toISOString().split('T')[0];
      const startStr = formatYMD(startDate);
      const endStr = formatYMD(endDate);

      const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${long}&start_date=${startStr}&end_date=${endStr}&daily=precipitation_sum&timezone=auto`;
      
      const response = await axios.get(url);
      const data = response.data.daily;

      const dailyData = [];
      let totalRainfall = 0;
      let maxRain = { date: '', amount: -1 };

      for (let i = 0; i < data.time.length; i++) {
        const rain = data.precipitation_sum[i] || 0;
        dailyData.push({
          date: data.time[i],
          precipitation: rain
        });

        totalRainfall += rain;
        if (rain > maxRain.amount) {
          maxRain = { date: data.time[i], amount: rain };
        }
      }

      return {
        summary: {
          total_rainfall: parseFloat(totalRainfall.toFixed(2)),
          average_daily: parseFloat((totalRainfall / days).toFixed(2)),
          max_rainfall_day: maxRain
        },
        daily_data: dailyData
      };

    } catch (error: any) {
      console.error('Lỗi khi gọi Open-Meteo:', error.message);
      throw new Error('Không thể lấy dữ liệu lịch sử mưa');
    }
  },

  // =====================================================================
  // --- CÁC HÀM MỚI BỔ SUNG CHO TÍNH NĂNG THÔNG BÁO THỜI TIẾT BUỔI SÁNG ---
  // =====================================================================

  // 4. Lấy dữ liệu thời tiết hôm nay từ Open-Meteo (Dùng riêng cho Cron Job)
  getDailyWeather: async (lat: number, lon: number, timezone: string) => {
    try {
      // Gọi API lấy dự báo nhiệt độ, xác suất mưa và UV theo giờ cho đúng 1 ngày
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation_probability,uv_index&daily=temperature_2m_max,temperature_2m_min&timezone=${encodeURIComponent(timezone)}&forecast_days=1`;
      
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu thời tiết Daily:', error);
      return null;
    }
  },

  // 5. Logic Rule-based phân tích dữ liệu và sinh ra câu thông báo thông minh
  generateWeatherMessage: (weatherData: any): string => {
    if (!weatherData || !weatherData.daily || !weatherData.hourly) {
      return "🌤️ Hôm nay trời quang mây tạnh, chúc bạn một ngày tốt lành!";
    }

    // Trích xuất nhiệt độ cao/thấp nhất trong ngày
    const tempMax = Math.round(weatherData.daily.temperature_2m_max[0]);
    const tempMin = Math.round(weatherData.daily.temperature_2m_min[0]);
    
    const hourlyPop = weatherData.hourly.precipitation_probability; // Mảng % xác suất mưa
    const hourlyUvi = weatherData.hourly.uv_index; // Mảng chỉ số UV
    const hourlyTime = weatherData.hourly.time; // Mảng thời gian "2026-04-12T07:00"

    // 5.1 Tìm thời điểm mưa gần nhất (Khả năng mưa > 50%)
    let rainHour = -1;
    let maxPop = 0;
    
    // Chỉ quét từ 7h sáng đến 24h đêm (Bỏ qua các giờ trước 7h sáng vì đã qua)
    for (let i = 7; i < 24; i++) { 
      if (hourlyPop[i] > maxPop) maxPop = hourlyPop[i];
      if (hourlyPop[i] > 50 && rainHour === -1) {
        // Lấy giờ từ chuỗi thời gian (VD: "2026-04-12T14:00" -> 14)
        rainHour = new Date(hourlyTime[i]).getHours();
      }
    }

    // 5.2 Tìm mức UV cao nhất trong ngày (thường quét từ 7h sáng đến 18h tối)
    const maxUv = Math.max(...hourlyUvi.slice(7, 18));

    // 5.3 Lắp ghép thành chuỗi thông điệp
    if (maxPop > 70 && rainHour !== -1) {
      return `⚠️ Chiều nay có thể mưa lớn lúc ${rainHour}h (xác suất ${maxPop}%). Nhớ mang áo mưa nhé!`;
    } 
    
    if (rainHour !== -1) {
      return `🌧️ Dự báo có mưa lúc ${rainHour}h, nhiệt độ ${tempMin}-${tempMax}°C. Đừng quên mang ô.`;
    }

    if (tempMax > 35) {
      return `🔥 Nắng nóng đỉnh điểm lên tới ${tempMax}°C. Hạn chế ra ngoài vào buổi trưa nhé!`;
    }

    if (maxUv > 7) {
      return `☀️ Trời nắng ráo ${tempMax}°C, nhưng chỉ số UV rất cao (${maxUv}). Bạn nhớ dùng kem chống nắng.`;
    }

    // Mặc định (Trời đẹp)
    return `🌤️ Hôm nay trời đẹp, nhiệt độ từ ${tempMin}°C đến ${tempMax}°C. Chúc bạn ngày mới năng động!`;
  }
};