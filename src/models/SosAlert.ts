import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface SosAlertAttributes {
  id: number;
  user_id: number;
  location: any; 
  contact_phone: string | null;
  emergency_type: string;
  description: string;
  status: 'pending' | 'processing' | 'resolved';
  reported_at: Date;
}

class SosAlert extends Model<SosAlertAttributes, Optional<SosAlertAttributes, 'id' | 'status' | 'reported_at' | 'contact_phone'>> implements SosAlertAttributes {
  public id!: number;
  public user_id!: number;
  public location!: any;
  public contact_phone!: string | null;
  public emergency_type!: string;
  public description!: string;
  public status!: 'pending' | 'processing' | 'resolved';
  public reported_at!: Date;
}

SosAlert.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  location: { type: DataTypes.GEOMETRY('POINT', 4326), allowNull: false },
  contact_phone: { type: DataTypes.STRING(20), allowNull: true },
  emergency_type: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  status: { type: DataTypes.ENUM('pending', 'processing', 'resolved'), defaultValue: 'pending' },
  reported_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { sequelize, tableName: 'sos_alerts', timestamps: true });

export default SosAlert;