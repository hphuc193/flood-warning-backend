import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import Location from './Location';

// Định nghĩa các mức độ cảnh báo (theo chuẩn màu sắc: Xanh/Vàng/Cam/Đỏ)
export enum AlertSeverity {
  LOW = 'low',         // Xanh - Ít nguy hiểm
  MEDIUM = 'medium',   // Vàng - Cần chú ý
  HIGH = 'high',       // Cam - Nguy hiểm
  CRITICAL = 'critical' // Đỏ - Khẩn cấp
}

interface AlertAttributes {
  id: string; // Dùng UUID
  location_id: number;
  title: string;
  description: string;
  severity: AlertSeverity;
  status: 'active' | 'resolved'; // Đang diễn ra | Đã xử lý xong
  affected_radius: number; // Bán kính ảnh hưởng (mét)
  started_at: Date;
  ended_at?: Date;
}

interface AlertCreationAttributes extends Optional<AlertAttributes, 'id' | 'status' | 'started_at' | 'ended_at'> {}

class Alert extends Model<AlertAttributes, AlertCreationAttributes> implements AlertAttributes {
  public id!: string;
  public location_id!: number;
  public title!: string;
  public description!: string;
  public severity!: AlertSeverity;
  public status!: 'active' | 'resolved';
  public affected_radius!: number;
  public started_at!: Date;
  public ended_at!: Date;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Alert.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    location_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: Location, key: 'id' }
    },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    severity: {
      type: DataTypes.ENUM(...Object.values(AlertSeverity)),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('active', 'resolved'),
      defaultValue: 'active',
    },
    affected_radius: { type: DataTypes.INTEGER, defaultValue: 1000 }, // Mặc định 1km
    started_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    ended_at: { type: DataTypes.DATE },
  },
  {
    sequelize,
    tableName: 'alerts',
    indexes: [{ fields: ['status', 'severity'] }] // Index để lọc nhanh các cảnh báo đang active
  }
);

// Quan hệ
Location.hasMany(Alert, { foreignKey: 'location_id', as: 'alerts' });
Alert.belongsTo(Location, { foreignKey: 'location_id', as: 'location' });

export default Alert;