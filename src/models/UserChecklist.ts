import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import User from './User';

interface UserChecklistAttributes {
  id: number;
  user_id: number;
  completed_items: string[]; // Mảng chứa các ID/Mã của item đã hoàn thành
}

interface UserChecklistCreationAttributes extends Optional<UserChecklistAttributes, 'id'> {}

class UserChecklist extends Model<UserChecklistAttributes, UserChecklistCreationAttributes> implements UserChecklistAttributes {
  public id!: number;
  public user_id!: number;
  public completed_items!: string[];

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

UserChecklist.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true, // Mỗi user chỉ có 1 record tiến độ checklist
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    completed_items: {
      type: DataTypes.JSON, // Postgres hỗ trợ JSON rất tốt để lưu mảng
      defaultValue: [],
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'user_checklists',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default UserChecklist;