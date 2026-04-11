import { Router } from 'express';
import multer from 'multer';
import { 
    createReport, 
    getReports, 
    updateReportStatus, 
    getReportsNearby,
    voteReport
} from '../controllers/report.controller';
import { verifyToken, checkAdmin } from '../middleware/auth.middleware';

const router = Router();

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.get('/nearby', getReportsNearby); 

router.get('/', verifyToken, getReports); 
router.post('/', verifyToken, upload.array('images', 5), createReport);
router.patch('/:id/status', verifyToken, checkAdmin, updateReportStatus);

router.post('/:id/vote', verifyToken, voteReport);

export default router;