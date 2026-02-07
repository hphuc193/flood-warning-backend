"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
// 2. Class Model
class User extends sequelize_1.Model {
}
// 3. Khởi tạo bảng
User.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    firebase_uid: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        unique: true, // Mỗi Firebase UID chỉ được tồn tại 1 lần
    },
    full_name: {
        type: sequelize_1.DataTypes.STRING,
    },
    email: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
    },
    password: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true, // Google User không có pass nên phải cho null
    },
    phone_number: {
        type: sequelize_1.DataTypes.STRING,
    },
    avatar_url: {
        type: sequelize_1.DataTypes.STRING,
    },
    role: {
        type: sequelize_1.DataTypes.ENUM('user', 'admin', 'rescuer'),
        defaultValue: 'user',
    },
    fcm_token: {
        type: sequelize_1.DataTypes.STRING, // Token dài nên dùng String/Text
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('active', 'banned'),
        defaultValue: 'active',
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'users',
});
exports.default = User;
