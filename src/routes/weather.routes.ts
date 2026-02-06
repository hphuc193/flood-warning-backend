
import { Router } from 'express';
import { addWeatherData, getCurrentWeather, getWeatherHistory } from '../controllers/weather.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Weather
 *   description: API quản lý dữ liệu thời tiết
 */

/**
 * @swagger
 * /weather:
 *   post:
 *     summary: Gửi dữ liệu thời tiết mới
 *     tags: [Weather]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - location_id
 *               - temperature
 *             properties:
 *               location_id:
 *                 type: integer
 *                 example: 1
 *               temperature:
 *                 type: number
 *                 example: 29.5
 *               humidity:
 *                 type: number
 *                 example: 85
 *               rainfall:
 *                 type: number
 *                 example: 120
 *               wind_speed:
 *                 type: number
 *                 example: 15
 *     responses:
 *       201:
 *         description: Tạo thành công
 *       500:
 *         description: Lỗi Server
 */

router.post('/', addWeatherData);         // Thêm dữ liệu
router.get('/current', getCurrentWeather); // Xem hiện tại
router.get('/history', getWeatherHistory); // Xem lịch sử

export default router;