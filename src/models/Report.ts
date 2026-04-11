import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface ReportAttributes {
  id: number;
  user_id: number;
  lat: number;
  long: number;
  description?: string | null;
  images: string[];
  status: 'pending' | 'verified' | 'rejected';
  upvotes: number;
  downvotes: number;
}

interface ReportCreationAttributes extends Optional<ReportAttributes, 'id' | 'status' | 'images' | 'upvotes' | 'downvotes'> {}

class Report extends Model<ReportAttributes, ReportCreationAttributes> implements ReportAttributes {
  public id!: number;
  public user_id!: number;
  public lat!: number;
  public long!: number;
  public description?: string | null;
  public images!: string[];
  public status!: 'pending' | 'verified' | 'rejected';
  public upvotes!: number;     // Thêm mới
  public downvotes!: number;   // Thêm mới
  
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public static associate(models: any) {
    Report.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  }
}

Report.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: { 
      type: DataTypes.INTEGER, 
      allowNull: false 
    },
    lat: { 
      type: DataTypes.DECIMAL(10, 8), 
      allowNull: false 
    },
    long: { 
      type: DataTypes.DECIMAL(11, 8), 
      allowNull: false 
    },
    description: { 
      type: DataTypes.TEXT,
      allowNull: true
    },
    images: { 
      type: DataTypes.ARRAY(DataTypes.TEXT), 
      defaultValue: [] 
    },
    status: { 
      type: DataTypes.ENUM('pending', 'verified', 'rejected'), 
      defaultValue: 'pending' 
    },
    // Khai báo 2 cột mới trong DB
    upvotes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0 // Đảm bảo số mặc định luôn là 0 để tính toán (+/-) không bị lỗi NaN
    },
    downvotes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  },
  { 
    sequelize, 
    tableName: 'reports',
    underscored: true,
    timestamps: true 
  }
);

export default Report;