import { Router } from 'express';
import { createLocation, getAllLocations, getNearbyLocations } from '../controllers/location.controller';

const router = Router();

// Định nghĩa các endpoint
router.post('/', createLocation);          // Tạo mới
router.get('/', getAllLocations);          // Lấy tất cả
router.get('/nearby', getNearbyLocations); // Tìm gần đây (Đặt trước /:id để tránh trùng)

export default router;