import { Router } from 'express';
import multer from 'multer';
import { 
    createReport, 
    getReports, 
    updateReportStatus, 
    getReportsNearby 
} from '../controllers/report.controller';
import { verifyToken, checkAdmin } from '../middleware/auth.middleware';

const router = Router();

// Cấu hình upload ảnh
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

// 1. Route Tìm kiếm (Nearby) -> PHẢI ĐẶT LÊN ĐẦU
router.get('/nearby', getReportsNearby); 

// 2. Route Lấy danh sách (Gốc)
router.get('/', getReports);

// 3. Route Tạo mới
router.post('/', verifyToken, upload.array('images', 5), createReport);

// 4. Route Admin duyệt (Có tham số :id nên đặt ở cuối cùng)
router.patch('/:id/status', verifyToken, checkAdmin, updateReportStatus);

export default router;