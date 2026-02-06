"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWeatherHistory = exports.getCurrentWeather = exports.addWeatherData = void 0;
const WeatherData_1 = __importDefault(require("../models/WeatherData"));
const Location_1 = __importDefault(require("../models/Location"));
const socket_service_1 = __importDefault(require("../services/socket.service"));
// 1. API: Nhận dữ liệu từ Sensor hoặc Job đồng bộ
const addWeatherData = async (req, res) => {
    try {
        const { location_id, temperature, humidity, rainfall, wind_speed } = req.body;
        // Kiểm tra xem địa điểm có tồn tại không
        const location = await Location_1.default.findByPk(location_id);
        if (!location) {
            return res.status(404).json({ success: false, message: 'Địa điểm không tồn tại' });
        }
        const data = await WeatherData_1.default.create({
            location_id,
            temperature,
            humidity,
            rainfall,
            wind_speed
        });
        console.log(`🔥 [DEBUG] Chuẩn bị bắn Socket cho Location ID: ${location_id}`);
        socket_service_1.default.emitToLocation(location_id, 'weather_update', {
            location_id,
            temperature,
            rainfall,
            recorded_at: new Date()
        });
        console.log(`✅ [DEBUG] Đã bắn xong Socket!`);
        return res.status(201).json({ success: true, data });
    }
    catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};
exports.addWeatherData = addWeatherData;
// 2. API: Lấy thời tiết mới nhất của một địa điểm
const getCurrentWeather = async (req, res) => {
    try {
        const { location_id } = req.query;
        if (!location_id) {
            return res.status(400).json({ success: false, message: 'Thiếu location_id' });
        }
        // --- FIX: Ép kiểu string sang number ---
        const id = parseInt(location_id);
        const current = await WeatherData_1.default.findOne({
            where: { location_id: id }, // Truyền số đã parse vào đây
            order: [['recorded_at', 'DESC']],
            include: [{ model: Location_1.default, as: 'location', attributes: ['name'] }]
        });
        if (!current) {
            return res.status(404).json({ success: false, message: 'Chưa có dữ liệu thời tiết cho khu vực này' });
        }
        return res.status(200).json({ success: true, data: current });
    }
    catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};
exports.getCurrentWeather = getCurrentWeather;
// 3. API: Lấy lịch sử (để vẽ biểu đồ)
const getWeatherHistory = async (req, res) => {
    try {
        const { location_id, limit } = req.query;
        if (!location_id) {
            return res.status(400).json({ success: false, message: 'Thiếu location_id' });
        }
        // --- FIX: Ép kiểu cho cả location_id và limit ---
        const id = parseInt(location_id);
        const limitNum = limit ? parseInt(limit) : 24;
        const history = await WeatherData_1.default.findAll({
            where: { location_id: id }, // Truyền số đã parse vào đây
            order: [['recorded_at', 'DESC']],
            limit: limitNum
        });
        return res.status(200).json({ success: true, data: history });
    }
    catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};
exports.getWeatherHistory = getWeatherHistory;
