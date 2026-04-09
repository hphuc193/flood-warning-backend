import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
// KHÔNG import User tại đây để tránh Circular Dependency

interface ReportAttributes {
  id: number;
  user_id: number;
  lat: number;
  long: number;
  description?: string | null;
  images: string[];
  status: 'pending' | 'verified' | 'rejected';
}

interface ReportCreationAttributes extends Optional<ReportAttributes, 'id' | 'status' | 'images'> {}

class Report extends Model<ReportAttributes, ReportCreationAttributes> implements ReportAttributes {
  public id!: number;
  public user_id!: number;
  public lat!: number;
  public long!: number;
  public description?: string | null; // Sửa lại cho khớp với Nullable của DB
  public images!: string[];
  public status!: 'pending' | 'verified' | 'rejected';
  
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Khai báo hàm associate để gọi ở file index.ts
  public static associate(models: any) {
    Report.belongsTo(models.User, { foreignKey: 'user_id', as: 'reporter' });
  }
}

Report.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: { 
      type: DataTypes.INTEGER, 
      allowNull: false 
      // Có thể thêm tham chiếu ở mức DB Constraint tại đây:
      // references: { model: 'users', key: 'id' }
    },
    lat: { 
      type: DataTypes.DECIMAL(10, 8), // Tối ưu cho tọa độ
      allowNull: false 
    },
    long: { 
      type: DataTypes.DECIMAL(11, 8), // Tối ưu cho tọa độ
      allowNull: false 
    },
    description: { 
      type: DataTypes.TEXT,
      allowNull: true
    },
    images: { 
      // Lưu ý: Đảm bảo bạn đang dùng PostgreSQL. Nếu dùng DB khác, đổi sang DataTypes.JSON
      type: DataTypes.ARRAY(DataTypes.TEXT), 
      defaultValue: [] 
    },
    status: { 
      type: DataTypes.ENUM('pending', 'verified', 'rejected'), 
      defaultValue: 'pending' 
    }
  },
  { 
    sequelize, 
    tableName: 'reports',
    underscored: true, // Ép Sequelize map createdAt -> created_at
    timestamps: true 
  }
);

export default Report;