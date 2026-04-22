import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface LocalContactAttributes {
  id: number;
  name: string;            
  phone_number: string;
  description: string;
  province: string;
  location: any;
  is_active: boolean;
}

class LocalContact extends Model<LocalContactAttributes, Optional<LocalContactAttributes, 'id' | 'is_active'>> implements LocalContactAttributes {
  public id!: number;
  public name!: string;
  public phone_number!: string;
  public description!: string;
  public province!: string;
  public location!: any;
  public is_active!: boolean;
}

LocalContact.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  phone_number: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  province: { type: DataTypes.STRING, allowNull: false },
  location: { type: DataTypes.GEOMETRY('POINT', 4326), allowNull: false },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { sequelize, tableName: 'local_contacts', timestamps: true });

export default LocalContact;