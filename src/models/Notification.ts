import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import User from './User';

interface NotificationAttributes {
  id: number;
  user_id: number;
  title: string;
  body: string;
  type: string; // Phân loại: 'WEATHER', 'SOS', 'SYSTEM', 'REPORT'
  is_read: boolean; // Trạng thái đã đọc hay chưa
  created_at: Date;
}

class Notification extends Model<NotificationAttributes, Optional<NotificationAttributes, 'id' | 'is_read' | 'created_at'>> implements NotificationAttributes {
  public id!: number;
  public user_id!: number;
  public title!: string;
  public body!: string;
  public type!: string;
  public is_read!: boolean;
  public created_at!: Date;
}

Notification.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  body: { type: DataTypes.TEXT, allowNull: false },
  type: { type: DataTypes.STRING, defaultValue: 'SYSTEM' },
  is_read: { type: DataTypes.BOOLEAN, defaultValue: false },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { 
  sequelize, 
  tableName: 'notifications', 
  timestamps: false // Ta chỉ cần created_at, không cần updated_at
});

// Thiết lập quan hệ
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user', onDelete: 'CASCADE' });
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });

export default Notification;