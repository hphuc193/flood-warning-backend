"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const Location_1 = __importDefault(require("./Location")); // Import để tạo khóa ngoại
class WeatherData extends sequelize_1.Model {
}
WeatherData.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    location_id: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Location_1.default, // Khóa ngoại
            key: 'id',
        },
    },
    temperature: { type: sequelize_1.DataTypes.FLOAT },
    humidity: { type: sequelize_1.DataTypes.FLOAT },
    rainfall: { type: sequelize_1.DataTypes.FLOAT, defaultValue: 0 },
    wind_speed: { type: sequelize_1.DataTypes.FLOAT, defaultValue: 0 },
    recorded_at: {
        type: sequelize_1.DataTypes.DATE,
        defaultValue: sequelize_1.DataTypes.NOW, // Mặc định là thời điểm hiện tại
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'weather_data',
    indexes: [
        {
            fields: ['location_id', 'recorded_at'], // Đánh index để truy vấn lịch sử cho nhanh
        },
    ],
});
// Thiết lập quan hệ (Association)
Location_1.default.hasMany(WeatherData, { foreignKey: 'location_id', as: 'weather_logs' });
WeatherData.belongsTo(Location_1.default, { foreignKey: 'location_id', as: 'location' });
exports.default = WeatherData;
