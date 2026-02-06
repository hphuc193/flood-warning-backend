"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendAlertNotification = void 0;
const firebase_1 = require("../config/firebase");
const User_1 = __importDefault(require("../models/User"));
const sequelize_1 = require("sequelize");
// Hàm gửi thông báo cảnh báo đến người dùng
const sendAlertNotification = async (alert) => {
    try {
        // 1. Lấy danh sách token của người dùng (những người có fcm_token)
        // *Nâng cao: Sau này có thể lọc user đang ở gần vị trí cảnh báo (dùng PostGIS)
        const users = await User_1.default.findAll({
            where: {
                fcm_token: { [sequelize_1.Op.ne]: null } // Lấy user đã có token
            },
            attributes: ['fcm_token']
        });
        const tokens = users.map(u => u.fcm_token);
        if (tokens.length === 0) {
            console.log('⚠️ Không có user nào để gửi thông báo.');
            return;
        }
        // 2. Cấu hình nội dung thông báo
        const message = {
            notification: {
                title: `⚠️ CẢNH BÁO: ${alert.title}`,
                body: alert.description.substring(0, 100) + '...' // Cắt ngắn nếu dài quá
            },
            data: {
                type: 'ALERT',
                alertId: alert.id.toString(),
                severity: alert.severity
            },
            tokens: tokens // Gửi cho danh sách token
        };
        // 3. Gửi qua Firebase
        const response = await firebase_1.firebaseMessaging.sendEachForMulticast(message);
        console.log(`✅ Đã gửi thông báo thành công: ${response.successCount}/${tokens.length} thiết bị.`);
        if (response.failureCount > 0) {
            console.log('❌ Một số tin nhắn gửi thất bại:', response.responses);
        }
    }
    catch (error) {
        console.error('❌ Lỗi khi gửi FCM:', error);
    }
};
exports.sendAlertNotification = sendAlertNotification;
