import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import Report from './Report';

// 1. Interface mô tả các trường dữ liệu của User
interface UserAttributes {
  id: number; // Chúng ta sẽ dùng UUID thay vì số tự tăng để bảo mật hơn
  firebase_uid?: string; // ID của user bên Firebase (quan trọng để link tài khoản)
  full_name?: string;
  email: string;
  phone_number?: string;
  avatar_url?: string;
  role: 'user' | 'admin' | 'rescuer'; // Phân quyền: Người dùng, Admin, Cứu hộ
  fcm_token?: string; // Token để gửi thông báo đẩy (Push Notification)
  status: 'active' | 'banned';
  password?: string;
}

// Interface cho lúc tạo mới (id sẽ tự tạo nên là optional)
interface UserCreationAttributes extends Optional<UserAttributes, 'id'> {}

// 2. Class Model
class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public firebase_uid!: string;
  public full_name!: string;
  public email!: string;
  public phone_number!: string;
  public avatar_url!: string;
  public role!: 'user' | 'admin' | 'rescuer';
  public fcm_token!: string;
  public status!: 'active' | 'banned';
  public password!: string;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

// 3. Khởi tạo bảng
User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    firebase_uid: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true, // Mỗi Firebase UID chỉ được tồn tại 1 lần
    },
    full_name: {
      type: DataTypes.STRING,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true, // Google User không có pass nên phải cho null
    },
    phone_number: {
      type: DataTypes.STRING,
    },
    avatar_url: {
      type: DataTypes.STRING,
    },
    role: {
      type: DataTypes.ENUM('user', 'admin', 'rescuer'),
      defaultValue: 'user',
    },
    fcm_token: {
      type: DataTypes.STRING, // Token dài nên dùng String/Text
    },
    status: {
      type: DataTypes.ENUM('active', 'banned'),
      defaultValue: 'active',
    },
  },
  {
    sequelize,
    tableName: 'users',
  }
);

export default User;