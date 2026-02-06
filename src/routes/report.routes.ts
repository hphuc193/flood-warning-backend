import { Router } from 'express';
import multer from 'multer';
import { createReport, getReports } from '../controllers/report.controller';

const router = Router();

// Cấu hình Multer: Lưu file vào RAM tạm thời trước khi đẩy lên Firebase
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // Giới hạn 5MB
});

// Endpoint
router.post('/', upload.array('images', 5), createReport);
router.get('/', getReports);

export default router;