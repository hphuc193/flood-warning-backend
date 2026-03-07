import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

export const WeatherService = {
  // Lấy thời tiết hiện tại theo tọa độ (lat, long)
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

  //Lấy dự báo 5 ngày tới
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

  // Lấy dữ liệu mưa lịch sử từ Open-Meteo
  getHistoricalRainfall: async (lat: number, long: number, days: number) => {
    try {
      // Tính toán ngày bắt đầu và kết thúc (Open-Meteo Archive thường trễ 2-5 ngày so với hiện tại)
      const endDate = new Date();
      endDate.setDate(endDate.getDate() - 3); // Lùi lại 3 ngày cho chắc chắn có dữ liệu
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - days);

      // Format ngày chuẩn YYYY-MM-DD
      const formatYMD = (date: Date) => date.toISOString().split('T')[0];
      const startStr = formatYMD(startDate);
      const endStr = formatYMD(endDate);

      // Gọi API Open-Meteo Archive
      const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${long}&start_date=${startStr}&end_date=${endStr}&daily=precipitation_sum&timezone=auto`;
      
      const response = await axios.get(url);
      const data = response.data.daily;

      // Xử lý dữ liệu trả về mảng object cho dễ dùng
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
  }
};