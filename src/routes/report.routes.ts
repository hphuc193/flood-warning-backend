import { Router } from 'express';
import multer from 'multer';
import { 
    createReport, 
    getReports, 
    updateReportStatus, 
    getReportsNearby,
    voteReport,
    deleteReport
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
router.post('/:id/vote', verifyToken, voteReport);
// ADMIN -------------------------------------------------
router.patch('/:id/status', verifyToken, checkAdmin, updateReportStatus);
router.delete('/:id', verifyToken, checkAdmin, deleteReport);


export default router;