import { Router } from 'express';
import { addWeatherData, getCurrentWeather, getWeatherHistory } from '../controllers/weather.controller';

const router = Router();

/**
 * @swagger
 * tags:
 * name: Weather
 * description: API quản lý dữ liệu thời tiết
 */

/**
 * @swagger
 * /api/v1/weather:
 * post:
 * summary: Gửi dữ liệu thời tiết mới (Giả lập Sensor)
 * tags: [Weather]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - location_id
 * - temperature
 * properties:
 * location_id:
 * type: integer
 * example: 1
 * temperature:
 * type: number
 * example: 29.5
 * humidity:
 * type: number
 * example: 85
 * rainfall:
 * type: number
 * example: 120
 * wind_speed:
 * type: number
 * example: 15
 * responses:
 * 201:
 * description: Tạo thành công
 * 500:
 * description: Lỗi Server
 */
router.post('/', addWeatherData);

/**
 * @swagger
 * /api/v1/weather/current:
 * get:
 * summary: Lấy thời tiết hiện tại (OpenWeatherMap)
 * tags: [Weather]
 * parameters:
 * - in: query
 * name: lat
 * schema:
 * type: number
 * required: true
 * description: Vĩ độ
 * - in: query
 * name: long
 * schema:
 * type: number
 * required: true
 * description: Kinh độ
 * responses:
 * 200:
 * description: Thành công
 * 400:
 * description: Thiếu tọa độ
 */
router.get('/current', getCurrentWeather);

/**
 * @swagger
 * /api/v1/weather/history:
 * get:
 * summary: Lấy lịch sử thời tiết
 * tags: [Weather]
 * parameters:
 * - in: query
 * name: location_id
 * schema:
 * type: integer
 * required: true
 * description: ID địa điểm
 * responses:
 * 200:
 * description: Thành công
 */
router.get('/history', getWeatherHistory);

export default router;