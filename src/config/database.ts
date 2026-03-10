import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

// Load biến môi trường
dotenv.config();

// Ưu tiên dùng DATABASE_URL nếu có (chuẩn để Deploy), nếu không fallback về biến rời (chạy Local)
const dbUrl = process.env.DATABASE_URL;

let sequelize: Sequelize;

if (dbUrl) {
  // 1. Cấu hình dành cho Môi trường Production (Render -> Supabase)
  sequelize = new Sequelize(dbUrl, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true, // Bắt buộc bật SSL cho Supabase
        rejectUnauthorized: false // Bỏ qua xác thực chứng chỉ tự ký
      }
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true
    }
  });
} else {
  // 2. Cấu hình dành cho Môi trường Local (Máy tính của bạn)
  sequelize = new Sequelize(
    process.env.DB_NAME as string, 
    process.env.DB_USER as string, 
    process.env.DB_PASSWORD as string, 
    {
      host: process.env.DB_HOST,
      dialect: 'postgres',
      port: parseInt(process.env.DB_PORT || '5432'),
      logging: false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      define: {
        timestamps: true,
        underscored: true
      }
    }
  );
}

// Hàm kiểm tra kết nối và khởi tạo PostGIS
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL Connection has been established successfully.');

    // Kích hoạt PostGIS Extension
    await sequelize.query('CREATE EXTENSION IF NOT EXISTS postgis;');
    console.log('PostGIS extension enabled.');

  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1); 
  }
};

export { sequelize, connectDB };
// import { Sequelize } from 'sequelize';
// import dotenv from 'dotenv';

// // Load biến môi trường
// dotenv.config();

// const dbName = process.env.DB_NAME as string;
// const dbUser = process.env.DB_USER as string;
// const dbPassword = process.env.DB_PASSWORD as string;
// const dbHost = process.env.DB_HOST;

// // Khởi tạo instance Sequelize
// const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
//   host: dbHost,
//   dialect: 'postgres',
//   port: parseInt(process.env.DB_PORT || '5432'),
//   logging: false, // Tắt log SQL để terminal gọn gàng (bật lại nếu cần debug)
//   pool: {
//     max: 5,     // Số kết nối tối đa
//     min: 0,
//     acquire: 30000,
//     idle: 10000
//   },
//   define: {
//     timestamps: true, // Tự động tạo created_at, updated_at cho các bảng
//     underscored: true // Sử dụng snake_case cho tên cột (chuẩn SQL)
//   }
// });

// // Hàm kiểm tra kết nối và khởi tạo PostGIS
// const connectDB = async () => {
//   try {
//     // 1. Kiểm tra xác thực
//     await sequelize.authenticate();
//     console.log('PostgreSQL Connection has been established successfully.');

//     // 2. Kích hoạt PostGIS Extension (Quan trọng cho tính năng /locations/nearby)
//     // Lệnh này tương ứng với mục 3 trong tài liệu kiến trúc [cite: 287]
//     await sequelize.query('CREATE EXTENSION IF NOT EXISTS postgis;');
//     console.log('PostGIS extension enabled.');

//   } catch (error) {
//     console.error('Unable to connect to the database:', error);
//     process.exit(1); // Dừng app nếu không kết nối được DB
//   }
// };

// export { sequelize, connectDB };