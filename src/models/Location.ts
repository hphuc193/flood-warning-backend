import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

// 1. Định nghĩa Interface cho TypeScript (giúp code gợi ý thông minh)
interface LocationAttributes {
  id: number;
  name: string;
  description?: string;
  address?: string;
  coordinates: { type: 'Point'; coordinates: [number, number] }; // GeoJSON format: [long, lat]
  type: 'station' | 'danger_zone' | 'safe_zone'; // Loại địa điểm
}

// Interface cho lúc tạo mới (không cần ID vì tự tăng)
interface LocationCreationAttributes extends Optional<LocationAttributes, 'id'> {}

// 2. Định nghĩa Class Model
class Location extends Model<LocationAttributes, LocationCreationAttributes> implements LocationAttributes {
  public id!: number;
  public name!: string;
  public description!: string;
  public address!: string;
  public coordinates!: { type: 'Point'; coordinates: [number, number] };
  public type!: 'station' | 'danger_zone' | 'safe_zone';

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

// 3. Khởi tạo Model với Sequelize
Location.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    address: {
      type: DataTypes.STRING,
    },
    // QUAN TRỌNG: Kiểu dữ liệu hình học của PostGIS
    coordinates: {
      type: DataTypes.GEOMETRY('POINT'), 
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('station', 'danger_zone', 'safe_zone'),
      defaultValue: 'station',
    },
  },
  {
    sequelize,
    tableName: 'locations',
  }
);

export default Location;