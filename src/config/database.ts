import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

// Load biến môi trường
dotenv.config();

const dbName = process.env.DB_NAME as string;
const dbUser = process.env.DB_USER as string;
const dbPassword = process.env.DB_PASSWORD as string;
const dbHost = process.env.DB_HOST;

// Khởi tạo instance Sequelize
const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  dialect: 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
  logging: false, // Tắt log SQL để terminal gọn gàng (bật lại nếu cần debug)
  pool: {
    max: 5,     // Số kết nối tối đa
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true, // Tự động tạo created_at, updated_at cho các bảng
    underscored: true // Sử dụng snake_case cho tên cột (chuẩn SQL)
  }
});

// Hàm kiểm tra kết nối và khởi tạo PostGIS
const connectDB = async () => {
  try {
    // 1. Kiểm tra xác thực
    await sequelize.authenticate();
    console.log('PostgreSQL Connection has been established successfully.');

    // 2. Kích hoạt PostGIS Extension (Quan trọng cho tính năng /locations/nearby)
    // Lệnh này tương ứng với mục 3 trong tài liệu kiến trúc [cite: 287]
    await sequelize.query('CREATE EXTENSION IF NOT EXISTS postgis;');
    console.log('PostGIS extension enabled.');

  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1); // Dừng app nếu không kết nối được DB
  }
};

export { sequelize, connectDB };