import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import User from './User';

interface ReportAttributes {
  id: number;
  user_id: number; // Đổi thành number cho khớp với bảng User của bạn
  lat: number;
  long: number;
  description?: string;
  images: string[]; // Mảng chứa URL ảnh
  status: 'pending' | 'verified' | 'rejected';
}

interface ReportCreationAttributes extends Optional<ReportAttributes, 'id' | 'status' | 'images'> {}

class Report extends Model<ReportAttributes, ReportCreationAttributes> implements ReportAttributes {
  public id!: number;
  public user_id!: number;
  public lat!: number;
  public long!: number;
  public description!: string;
  public images!: string[];
  public status!: 'pending' | 'verified' | 'rejected';
  
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Report.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false }, // Khớp với User ID
    lat: { type: DataTypes.FLOAT, allowNull: false },
    long: { type: DataTypes.FLOAT, allowNull: false },
    description: { type: DataTypes.TEXT },
    images: { 
      type: DataTypes.ARRAY(DataTypes.TEXT), 
      defaultValue: [] 
    },
    status: { 
      type: DataTypes.ENUM('pending', 'verified', 'rejected'), 
      defaultValue: 'pending' 
    }
  },
  { sequelize, tableName: 'reports' }
);

// Quan hệ: Một User có nhiều Report
User.hasMany(Report, { foreignKey: 'user_id', as: 'reports' });
Report.belongsTo(User, { foreignKey: 'user_id', as: 'reporter' });

export default Report;