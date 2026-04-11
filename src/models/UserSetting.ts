import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import User from './User';

interface UserSettingAttributes {
  user_id: number;
  theme?: 'light' | 'dark' | 'system';
  noti_push?: boolean;
  noti_sms?: boolean;
  noti_email?: boolean;
  last_lat?: number | null;
  last_long?: number | null;
  timezone?: string;
  daily_weather_noti?: boolean;
}

interface UserSettingCreationAttributes extends Optional<UserSettingAttributes, 'theme' | 'noti_push' | 'noti_sms' | 'noti_email' | 'timezone' | 'daily_weather_noti'> {}

class UserSetting extends Model<UserSettingAttributes, UserSettingCreationAttributes> implements UserSettingAttributes {
  public user_id!: number;
  public theme!: 'light' | 'dark' | 'system';
  public noti_push!: boolean;
  public noti_sms!: boolean;
  public noti_email!: boolean;
  public last_lat!: number | null;
  public last_long!: number | null;
  public timezone!: string;
  public daily_weather_noti!: boolean;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

UserSetting.init(
  {
    user_id: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false },
    theme: { type: DataTypes.ENUM('light', 'dark', 'system'), defaultValue: 'system' },
    noti_push: { type: DataTypes.BOOLEAN, defaultValue: true },
    noti_sms: { type: DataTypes.BOOLEAN, defaultValue: false },
    noti_email: { type: DataTypes.BOOLEAN, defaultValue: false },
    last_lat: { type: DataTypes.DOUBLE, allowNull: true },
    last_long: { type: DataTypes.DOUBLE, allowNull: true },
    timezone: { type: DataTypes.STRING, defaultValue: 'Asia/Ho_Chi_Minh' },
    daily_weather_noti: { type: DataTypes.BOOLEAN, defaultValue: true }
  },
  {
    sequelize,
    tableName: 'user_settings',
    underscored: true,
    timestamps: true
  }
);

// Khai báo quan hệ 1-1
User.hasOne(UserSetting, { foreignKey: 'user_id', as: 'settings' });
UserSetting.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

export default UserSetting;