import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import Location from './Location'; // Import để tạo khóa ngoại

interface WeatherAttributes {
  id: number;
  location_id: number; // FK trỏ tới bảng Locations
  temperature: number; // Nhiệt độ (độ C)
  humidity: number;    // Độ ẩm (%)
  rainfall: number;    // Lượng mưa (mm) - Quan trọng nhất cho lũ lụt
  wind_speed: number;  // Tốc độ gió (km/h)
  recorded_at: Date;   // Thời gian ghi nhận
}

interface WeatherCreationAttributes extends Optional<WeatherAttributes, 'id' | 'recorded_at'> {}

class WeatherData extends Model<WeatherAttributes, WeatherCreationAttributes> implements WeatherAttributes {
  public id!: number;
  public location_id!: number;
  public temperature!: number;
  public humidity!: number;
  public rainfall!: number;
  public wind_speed!: number;
  public readonly recorded_at!: Date;
  
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

WeatherData.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    location_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Location, // Khóa ngoại
        key: 'id',
      },
    },
    temperature: { type: DataTypes.FLOAT },
    humidity: { type: DataTypes.FLOAT },
    rainfall: { type: DataTypes.FLOAT, defaultValue: 0 },
    wind_speed: { type: DataTypes.FLOAT, defaultValue: 0 },
    recorded_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW, // Mặc định là thời điểm hiện tại
    },
  },
  {
    sequelize,
    tableName: 'weather_data',
    indexes: [
      {
        fields: ['location_id', 'recorded_at'], // Đánh index để truy vấn lịch sử cho nhanh
      },
    ],
  }
);

// Thiết lập quan hệ (Association)
Location.hasMany(WeatherData, { foreignKey: 'location_id', as: 'weather_logs' });
WeatherData.belongsTo(Location, { foreignKey: 'location_id', as: 'location' });

export default WeatherData;