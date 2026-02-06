"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
// 2. Định nghĩa Class Model
class Location extends sequelize_1.Model {
}
// 3. Khởi tạo Model với Sequelize
Location.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
    },
    address: {
        type: sequelize_1.DataTypes.STRING,
    },
    // QUAN TRỌNG: Kiểu dữ liệu hình học của PostGIS
    coordinates: {
        type: sequelize_1.DataTypes.GEOMETRY('POINT'),
        allowNull: false,
    },
    type: {
        type: sequelize_1.DataTypes.ENUM('station', 'danger_zone', 'safe_zone'),
        defaultValue: 'station',
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'locations',
});
exports.default = Location;
