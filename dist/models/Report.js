"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const User_1 = __importDefault(require("./User"));
class Report extends sequelize_1.Model {
}
Report.init({
    id: { type: sequelize_1.DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: { type: sequelize_1.DataTypes.INTEGER, allowNull: false }, // Khớp với User ID
    lat: { type: sequelize_1.DataTypes.FLOAT, allowNull: false },
    long: { type: sequelize_1.DataTypes.FLOAT, allowNull: false },
    description: { type: sequelize_1.DataTypes.TEXT },
    images: {
        type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.TEXT),
        defaultValue: []
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('pending', 'verified', 'rejected'),
        defaultValue: 'pending'
    }
}, { sequelize: database_1.sequelize, tableName: 'reports' });
// Quan hệ: Một User có nhiều Report
User_1.default.hasMany(Report, { foreignKey: 'user_id', as: 'reports' });
Report.belongsTo(User_1.default, { foreignKey: 'user_id', as: 'reporter' });
exports.default = Report;
