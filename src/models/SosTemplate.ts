import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface SosTemplateAttributes {
  id: number;
  user_id: number;
  default_description: string;
}

class SosTemplate extends Model<SosTemplateAttributes, Optional<SosTemplateAttributes, 'id'>> implements SosTemplateAttributes {
  public id!: number;
  public user_id!: number;
  public default_description!: string;
}

SosTemplate.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  default_description: { type: DataTypes.TEXT, allowNull: false },
}, { sequelize, tableName: 'sos_templates', timestamps: true });

export default SosTemplate;