import express from 'express';
import { connectDB, sequelize } from './config/database';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger';

import reportRoutes from './routes/report.routes';
import authRoutes from './routes/auth.routes';
import locationRoutes from './routes/location.routes';
import weatherRoutes from './routes/weather.routes';
import alertRoutes from './routes/alert.routes';
import userRoutes from './routes/user.routes';
import userLocationRoutes from './routes/userLocation.routes';
import checklistRoutes from './routes/checklist.routes';
import evacuationRoutes from './routes/evacuation.routes';
import emergencyRoutes from './routes/emergency.routes';
import sosRoutes from './routes/sos.routes';
import { startWeatherCronJob } from './jobs/weatherNotification.job';
// import socketService from './services/socket.service'; 

import './models/User';
import './models/Location';
import './models/WeatherData';
import './models/Alert';
import './models/Report';

dotenv.config();

const app = express();

// 1. Tạo HTTP Server
export const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;

// 2. Tạo Socket.io Server và Export nó ra
export const io = new Server(httpServer, {
  cors: {
    origin: "*", // Cho phép mọi nơi kết nối (Client Flutter, Postman, Web...)
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(express.json());

// Đăng ký Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/locations', locationRoutes);
app.use('/api/v1/weather', weatherRoutes);
app.use('/api/v1/alerts', alertRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/user-locations', userLocationRoutes);
app.use('/api/v1/checklists', checklistRoutes);
app.use('/api/v1/evacuation', evacuationRoutes);
app.use('/api/v1/emergency-contacts', emergencyRoutes);
app.use('/api/v1/sos', sosRoutes);
console.log('📄 Swagger Docs available at http://localhost:3000/api-docs');

// Khởi động Server
const startServer = async () => {
  try {
    // Kết nối Database
    await connectDB();
    
    // Đồng bộ Model (Chỉ cần chạy 1 lần)
    await sequelize.sync({ alter: true });
    console.log(' 📩 Database synchronized.');

    // Lắng nghe cổng
    httpServer.listen(PORT, () => {
      console.log(` 🖥️  Server is running on http://localhost:${PORT}`);
      console.log(` 🌾 Socket.io is ready for connections`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
  }
};

startServer();
