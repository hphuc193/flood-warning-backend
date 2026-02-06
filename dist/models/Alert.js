"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertSeverity = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const Location_1 = __importDefault(require("./Location"));
// Định nghĩa các mức độ cảnh báo (theo chuẩn màu sắc: Xanh/Vàng/Cam/Đỏ)
var AlertSeverity;
(function (AlertSeverity) {
    AlertSeverity["LOW"] = "low";
    AlertSeverity["MEDIUM"] = "medium";
    AlertSeverity["HIGH"] = "high";
    AlertSeverity["CRITICAL"] = "critical"; // Đỏ - Khẩn cấp
})(AlertSeverity || (exports.AlertSeverity = AlertSeverity = {}));
class Alert extends sequelize_1.Model {
}
Alert.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    location_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: { model: Location_1.default, key: 'id' }
    },
    title: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    description: { type: sequelize_1.DataTypes.TEXT },
    severity: {
        type: sequelize_1.DataTypes.ENUM(...Object.values(AlertSeverity)),
        allowNull: false,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('active', 'resolved'),
        defaultValue: 'active',
    },
    affected_radius: { type: sequelize_1.DataTypes.INTEGER, defaultValue: 1000 }, // Mặc định 1km
    started_at: { type: sequelize_1.DataTypes.DATE, defaultValue: sequelize_1.DataTypes.NOW },
    ended_at: { type: sequelize_1.DataTypes.DATE },
}, {
    sequelize: database_1.sequelize,
    tableName: 'alerts',
    indexes: [{ fields: ['status', 'severity'] }] // Index để lọc nhanh các cảnh báo đang active
});
// Quan hệ
Location_1.default.hasMany(Alert, { foreignKey: 'location_id', as: 'alerts' });
Alert.belongsTo(Location_1.default, { foreignKey: 'location_id', as: 'location' });
exports.default = Alert;
