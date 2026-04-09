import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import Report from '../models/Report';
import User from '../models/User';
import { firebaseStorage } from '../config/firebase';
import { v4 as uuidv4 } from 'uuid';
import { io } from '../server';
import { Sequelize } from 'sequelize';
Report.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
// 1. Tạo báo cáo mới
export const createReport = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const user_id = authReq.user?.id;
    
    const { lat, long, description } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!user_id) {
        return res.status(401).json({ success: false, message: 'User ID không tồn tại trong Token' });
    }

    if (!lat || !long) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin lat hoặc long' });
    }

    const imageUrls: string[] = [];

    // Xử lý upload Firebase
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

    // === BẢN VÁ AN TOÀN ĐỂ FIX LỖI ẨN DANH ===
    // Tìm lại report vừa tạo, JOIN bảng User (dùng bí danh 'user' đã sửa ở Model)
    const reportWithUser = await Report.findByPk(newReport.id, {
      include: [
        {
          model: User,
          as: 'user', 
          attributes: ['id', 'full_name', 'avatar_url']
        }
      ]
    });

    // Ép sang JSON thuần để tránh lỗi Circular Dependency gây crash 500
    const responseData = reportWithUser ? reportWithUser.toJSON() : newReport;

    if (io) {
        io.emit('new_flood_report', responseData);
        console.log('📡 Đã bắn socket sự kiện: new_flood_report');
    }

    return res.status(201).json({ success: true, data: responseData });
    // ==========================================

  } catch (error: any) {
    console.error('Upload Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// 2. get list report 
export const getReports = async (req: Request, res: Response) => {
  try {
    const reports = await Report.findAll({
      order: [['created_at', 'DESC']],
      include: [
        {
          model: User,
          as: 'user', // Phải khớp với tên alias bạn setup trong quan hệ belongsTo
          attributes: ['id', 'full_name', 'avatar_url'] // Lấy tên và avatar
        }
      ]
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
    if (status === 'verified' && io) {
      io.emit('flood_verified', report); 
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
          [Sequelize.literal(haversine), 'distance'] 
        ]
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'full_name', 'avatar_url']
        }
      ],
      where: Sequelize.where(Sequelize.literal(haversine), '<=', r),
      order: Sequelize.literal('distance ASC') 
    });

    return res.status(200).json({ success: true, count: reports.length, data: reports });

  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};