"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveAlert = exports.getActiveAlerts = exports.createAlert = void 0;
const Alert_1 = __importDefault(require("../models/Alert"));
const Location_1 = __importDefault(require("../models/Location"));
const notification_service_1 = require("../services/notification.service");
// 1. Tạo cảnh báo mới
const createAlert = async (req, res) => {
    try {
        const { location_id, title, description, severity, affected_radius } = req.body;
        const location = await Location_1.default.findByPk(location_id);
        if (!location) {
            return res.status(404).json({ success: false, message: 'Địa điểm không tồn tại' });
        }
        const newAlert = await Alert_1.default.create({
            location_id,
            title,
            description,
            severity,
            affected_radius: affected_radius || 1000,
            status: 'active'
        });
        // --- MỚI THÊM: Gửi thông báo đẩy ngay lập tức ---
        // Không dùng await để tránh client phải đợi lâu, cho chạy ngầm (Fire & Forget)
        (0, notification_service_1.sendAlertNotification)(newAlert);
        // ------------------------------------------------
        return res.status(201).json({ success: true, data: newAlert });
    }
    catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};
exports.createAlert = createAlert;
// 2. Lấy danh sách cảnh báo đang hoạt động (Active)
const getActiveAlerts = async (req, res) => {
    try {
        const alerts = await Alert_1.default.findAll({
            where: { status: 'active' },
            include: [
                {
                    model: Location_1.default,
                    as: 'location',
                    // FIX: Bỏ 'lat', 'long' đi vì bảng Locations không có 2 cột này
                    // Dữ liệu tọa độ đã nằm trong 'coordinates'
                    attributes: ['name', 'coordinates']
                }
            ],
            order: [['started_at', 'DESC']]
        });
        return res.status(200).json({ success: true, count: alerts.length, data: alerts });
    }
    catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};
exports.getActiveAlerts = getActiveAlerts;
// 3. Giải quyết cảnh báo (Tắt cảnh báo)
const resolveAlert = async (req, res) => {
    try {
        const { id } = req.params;
        // --- FIX: Thêm 'as string' để ép kiểu ---
        const alert = await Alert_1.default.findByPk(id);
        if (!alert)
            return res.status(404).json({ success: false, message: 'Không tìm thấy cảnh báo' });
        await alert.update({
            status: 'resolved',
            ended_at: new Date()
        });
        return res.status(200).json({ success: true, message: 'Đã đóng cảnh báo', data: alert });
    }
    catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};
exports.resolveAlert = resolveAlert;
