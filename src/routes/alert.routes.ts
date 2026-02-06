import { Router } from 'express';
import { createAlert, getActiveAlerts, resolveAlert } from '../controllers/alert.controller';

const router = Router();

router.post('/', createAlert);           // Tạo alert
router.get('/active', getActiveAlerts);  // Lấy alert đang chạy
router.put('/:id/resolve', resolveAlert); // Kết thúc alert (Admin)

export default router;