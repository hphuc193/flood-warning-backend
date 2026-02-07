import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import Report from '../models/Report';
import { firebaseStorage } from '../config/firebase';
import { v4 as uuidv4 } from 'uuid';

// 1. Tạo báo cáo mới
export const createReport = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const user_id = authReq.user?.id;
    const { lat, long, description } = req.body;
    const files = req.files as Express.Multer.File[];

    // Kiểm tra User ID
    if (!user_id) {
        return res.status(401).json({ success: false, message: 'User ID không tồn tại trong Token' });
    }

    if (!lat || !long) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin lat hoặc long' });
    }
    const imageUrls: string[] = [];

    // Xử lý upload lên Firebase
    if (files && files.length > 0) {
      for (const file of files) {
        // Tạo tên file ngẫu nhiên để không bị trùng
        const filename = `reports/${uuidv4()}_${file.originalname}`;
        const blob = firebaseStorage.file(filename);

        const blobStream = blob.createWriteStream({
          metadata: { contentType: file.mimetype }
        });

        await new Promise((resolve, reject) => {
          blobStream.on('error', (err) => reject(err));
          blobStream.on('finish', () => resolve(true));
          blobStream.end(file.buffer);
        });

        // Lấy đường dẫn (Signed URL) - Hạn dùng 100 năm
        const [url] = await blob.getSignedUrl({
          action: 'read',
          expires: '01-01-2100'
        });
        
        imageUrls.push(url);
      }
    }

    // Lưu vào Database
    const newReport = await Report.create({
      user_id: user_id, // Ép kiểu về số
      lat: parseFloat(lat),
      long: parseFloat(long),
      description,
      images: imageUrls
    });

    return res.status(201).json({ success: true, data: newReport });

  } catch (error: any) {
    console.error('Upload Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// get list report 
export const getReports = async (req: Request, res: Response) => {
  try {
    const reports = await Report.findAll({
      order: [['created_at', 'DESC']]
    });
    return res.status(200).json({ success: true, data: reports });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};