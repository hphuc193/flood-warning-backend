import express from 'express';
import { getFloodForecast } from '../controllers/ai.controller';
import { verifyToken } from '../middleware/auth.middleware'; // Tùy vào cấu hình bảo mật của bạn

const router = express.Router();

// Lấy dự báo AI 24h cho biểu đồ
router.get('/forecast/:location_id', verifyToken, getFloodForecast);

export default router;