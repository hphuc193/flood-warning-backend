import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import Report from '../models/Report';
import { firebaseStorage } from '../config/firebase';
import { v4 as uuidv4 } from 'uuid';
import { io } from '../server';
import { Sequelize } from 'sequelize';

// 1. Tạo báo cáo mới
export const createReport = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const user_id = authReq.user?.id;
    // Sửa lại cách lấy user_id một chút nếu biến authReq báo lỗi, 
    // hoặc giữ nguyên nếu code cũ của bạn đã chạy tốt đoạn này.
    
    const { lat, long, description } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!user_id) {
        return res.status(401).json({ success: false, message: 'User ID không tồn tại trong Token' });
    }

    if (!lat || !long) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin lat hoặc long' });
    }

    const imageUrls: string[] = [];

    // (Giữ nguyên đoạn xử lý upload Firebase của bạn)
    if (files && files.length > 0) {
      for (const file of files) {
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

        const [url] = await blob.getSignedUrl({
          action: 'read',
          expires: '01-01-2100'
        });
        
        imageUrls.push(url);
      }
    }

    // Lưu vào Database
    const newReport = await Report.create({
      user_id: user_id, 
      lat: parseFloat(lat),
      long: parseFloat(long),
      description,
      images: imageUrls
    });

    if (io) {
        // Sự kiện: 'new_flood_report' -> App nghe thấy sẽ hiện thông báo
        io.emit('new_flood_report', newReport);
        console.log('📡 Đã bắn socket sự kiện: new_flood_report');
    }

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

// 3. Admin duyệt hoặc từ chối báo cáo
export const updateReportStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params; // Lấy ID bài viết từ URL
    const { status } = req.body; // Lấy trạng thái mới gửi lên ('verified' | 'rejected')

    // Validate đầu vào
    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
    }

    const report = await Report.findByPk(Number(id));
    if (!report) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy báo cáo' });
    }

    // Cập nhật
    report.status = status;
    await report.save();

    // === LOGIC THÔNG BÁO ===
    // Chỉ khi nào Admin DUYỆT (verified) thì mới bắn thông báo cho mọi người biết
    if (status === 'verified' && io) {
      io.emit('flood_verified', report); // Sự kiện này uy tín hơn 'new_flood_report'
    }

    return res.status(200).json({ success: true, message: 'Cập nhật thành công', data: report });

  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// 4. Lấy danh sách điểm ngập trong bán kính (Ví dụ: 10km)
export const getReportsNearby = async (req: Request, res: Response) => {
  try {
    const { lat, long, radius } = req.query;

    if (!lat || !long) {
      return res.status(400).json({ success: false, message: 'Thiếu tọa độ lat, long' });
    }

    const r = radius ? parseFloat(radius as string) : 5; // Mặc định 5km
    const userLat = parseFloat(lat as string);
    const userLong = parseFloat(long as string);

    // Công thức Haversine để tính khoảng cách (đơn vị: km)
    const haversine = `(
      6371 * acos(
        cos(radians(${userLat})) *
        cos(radians(lat)) *
        cos(radians(long) - radians(${userLong})) +
        sin(radians(${userLat})) *
        sin(radians(lat))
      )
    )`;

    const reports = await Report.findAll({
      attributes: {
        include: [
          [Sequelize.literal(haversine), 'distance'] // Thêm cột 'distance' vào kết quả
        ]
      },
      where: Sequelize.where(Sequelize.literal(haversine), '<=', r), // Chỉ lấy điểm trong bán kính r
      order: Sequelize.literal('distance ASC') // Sắp xếp từ gần đến xa
    });

    return res.status(200).json({ success: true, count: reports.length, data: reports });

  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};