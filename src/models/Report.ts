import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface ReportAttributes {
  id: number;
  user_id: number;
  lat: number;
  long: number;
  description?: string | null;
  category?: string | null; // MỚI: Loại sự cố (VD: Ngập nước, Cây đổ, Kẹt xe)
  severity: number;         // MỚI: Mức độ nghiêm trọng (1 - 5)
  images: string[];
  status: 'pending' | 'verified' | 'rejected';
  upvotes: number;     
  downvotes: number;   
}

interface ReportCreationAttributes extends Optional<ReportAttributes, 'id' | 'status' | 'images' | 'upvotes' | 'downvotes' | 'category' | 'severity'> {}

class Report extends Model<ReportAttributes, ReportCreationAttributes> implements ReportAttributes {
  public id!: number;
  public user_id!: number;
  public lat!: number;
  public long!: number;
  public description?: string | null;
  public category?: string | null; // MỚI
  public severity!: number;        // MỚI
  public images!: string[];
  public status!: 'pending' | 'verified' | 'rejected';
  
  public upvotes!: number;     
  public downvotes!: number;   
  
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public static associate(models: any) {
    Report.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  }
}

Report.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    lat: { type: DataTypes.DECIMAL(10, 8), allowNull: false },
    long: { type: DataTypes.DECIMAL(11, 8), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    // CỘT MỚI
    category: { 
      type: DataTypes.STRING, 
      allowNull: true 
    },
    severity: { 
      type: DataTypes.INTEGER, 
      allowNull: false,
      defaultValue: 1 // Mặc định là mức 1 (nhẹ nhất)
    },
    images: { type: DataTypes.ARRAY(DataTypes.TEXT), defaultValue: [] },
    status: { type: DataTypes.ENUM('pending', 'verified', 'rejected'), defaultValue: 'pending' },
    upvotes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    downvotes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
  },
  { 
    sequelize, 
    tableName: 'reports',
    underscored: true,
    timestamps: true 
  }
);

export default Report;