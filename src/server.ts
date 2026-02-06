import express from 'express';
import { connectDB, sequelize } from './config/database';
import dotenv from 'dotenv';
import { createServer } from 'http';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger';

import reportRoutes from './routes/report.routes';
import authRoutes from './routes/auth.routes';
import locationRoutes from './routes/location.routes';
import weatherRoutes from './routes/weather.routes';
import alertRoutes from './routes/alert.routes';
import socketService from './services/socket.service';

import './models/User';
import './models/Location';
import './models/WeatherData';
import './models/Alert';
import './models/Report';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;

// Socket.io
socketService.init(httpServer);

// Middleware
app.use(express.json());

// Đăng ký Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/locations', locationRoutes);
app.use('/api/v1/weather', weatherRoutes);
app.use('/api/v1/alerts', alertRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
console.log('📄 Swagger Docs available at http://localhost:3000/api-docs');

// Khởi động Server
const startServer = async () => {
  // Kết nối Database trước khi listen port
  
  await connectDB();
  await sequelize.sync({ alter: true });
  
  // Đồng bộ Model với Database (Dùng trong dev, production nên dùng Migration)
  // alter: true giúp cập nhật bảng nếu có thay đổi model mà không xóa dữ liệu
  await sequelize.sync({ alter: true });
  console.log('Database synchronized.');

  httpServer.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Socket.io is ready for connections`);
  });
};


startServer();