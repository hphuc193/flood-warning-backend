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
  }
};