"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const weather_controller_1 = require("../controllers/weather.controller");
const router = (0, express_1.Router)();
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
router.post('/', weather_controller_1.addWeatherData); // Thêm dữ liệu
router.get('/current', weather_controller_1.getCurrentWeather); // Xem hiện tại
router.get('/history', weather_controller_1.getWeatherHistory); // Xem lịch sử
exports.default = router;
