import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import User from './User';

interface UserLocationAttributes {
  id: number;
  user_id: number;
  name: string;
  coordinates: any; // Kiểu GEOMETRY của PostGIS
  radius: number; // Bán kính cảnh báo (km)
  priority: 'low' | 'medium' | 'high'; // Mức độ ưu tiên
  is_active: boolean; // Bật/tắt thông báo
}

interface UserLocationCreationAttributes extends Optional<UserLocationAttributes, 'id'> {}

class UserLocation extends Model<UserLocationAttributes, UserLocationCreationAttributes> implements UserLocationAttributes {
  public id!: number;
  public user_id!: number;
  public name!: string;
  public coordinates!: any;
  public radius!: number;
  public priority!: 'low' | 'medium' | 'high';
  public is_active!: boolean;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

UserLocation.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE', // Nếu xóa user thì xóa luôn các vị trí đã lưu
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false, // VD: "Nhà riêng", "Công ty"
    },
    coordinates: {
      type: DataTypes.GEOMETRY('POINT'),
      allowNull: false,
    },
    radius: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 5, // Mặc định 5km
      validate: {
        min: 1,
        max: 10, // Giới hạn từ 1-10km theo yêu cầu
      }
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      defaultValue: 'medium',
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true, // Mặc định bật thông báo
    },
  },
  {
    sequelize,
    tableName: 'user_locations',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default UserLocation;