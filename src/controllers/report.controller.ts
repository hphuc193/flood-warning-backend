import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import Report from '../models/Report';
import User from '../models/User';
import ReportVote from '../models/ReportVote'; // Import thêm Model Vote
import { firebaseStorage } from '../config/firebase';
import { v4 as uuidv4 } from 'uuid';
import { io } from '../server';
import { Sequelize, Op } from 'sequelize';
import { sequelize } from '../config/database';

Report.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// 1. Tạo báo cáo mới
export const createReport = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const user_id = authReq.user?.id;
    
    // LẤY THÊM category VÀ severity TỪ BODY
    const { lat, long, description, category, severity } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!user_id) {
        return res.status(401).json({ success: false, message: 'User ID không tồn tại trong Token' });
    }

    if (!lat || !long) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin lat hoặc long' });
    }

    // Validate Mức độ nghiêm trọng (1 -> 5)
    let severityLevel = 1; // Mặc định
    if (severity) {
      severityLevel = parseInt(severity as string);
      if (isNaN(severityLevel) || severityLevel < 1 || severityLevel > 5) {
        return res.status(400).json({ success: false, message: 'Mức độ nghiêm trọng phải là số từ 1 đến 5' });
      }
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

    // Lưu vào Database với các trường mới
    const newReport = await Report.create({
      user_id: user_id, 
      lat: parseFloat(lat),
      long: parseFloat(long),
      description,
      category: category || null, // Lưu loại sự cố
      severity: severityLevel,    // Lưu mức độ nghiêm trọng
      images: imageUrls
    });

    // Tìm lại report vừa tạo, JOIN bảng User
    const reportWithUser = await Report.findByPk(newReport.id, {
      include: [
        {
          model: User,
          as: 'user', 
          attributes: ['id', 'full_name', 'avatar_url']
        }
      ]
    });

    const responseData = reportWithUser ? reportWithUser.toJSON() : newReport;

    if (io) {
        io.emit('new_flood_report', responseData);
        console.log('📡 Đã bắn socket sự kiện: new_flood_report');
    }

    return res.status(201).json({ success: true, data: responseData });

  } catch (error: any) {
    console.error('Upload Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};  

// 2. Lấy danh sách báo cáo (Có kèm trạng thái Vote của User)
export const getReports = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const user_id = authReq.user?.id;

    // 1. Trích xuất Query Parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 15;
    const search = req.query.search as string;
    const status = req.query.status as string;
    
    // CÁC QUERY PARAMS MỚI BỔ SUNG
    const category = req.query.category as string;
    const severity = req.query.severity as string;
    const time_range = req.query.time_range as string; // '24h', '3d', '7d', '30d'

    const offset = (page - 1) * limit;

    // 2. Xây dựng bộ điều kiện truy vấn (Where Clause) linh hoạt
    let whereClause: any = {};

    if (status) whereClause.status = status;
    
    // Lọc theo Loại sự cố (VD: "Ngập nước", "Cây đổ")
    if (category) whereClause.category = category;

    // Lọc theo Mức độ nghiêm trọng
    // Hỗ trợ truyền 1 số (VD: ?severity=4) hoặc nhiều số cách nhau dấu phẩy (VD: ?severity=4,5)
    if (severity) {
      const severities = severity.split(',').map(s => parseInt(s.trim()));
      whereClause.severity = { [Op.in]: severities };
    }

    // Lọc theo khoảng thời gian (Time Range)
    if (time_range) {
      const now = new Date();
      let startDate = new Date();

      switch (time_range) {
        case '24h':
          startDate.setHours(now.getHours() - 24);
          break;
        case '3d':
          startDate.setDate(now.getDate() - 3);
          break;
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        default:
          startDate = new Date(0); // Nếu truyền sai, mặc định lấy từ đầu
      }

      // Lấy những báo cáo có thời gian tạo >= startDate
      whereClause.created_at = { [Op.gte]: startDate };
    }

    if (search) {
      whereClause.description = {
        [Op.iLike]: `%${search}%` 
      };
    }

    // 3. Thực thi truy vấn với bộ lọc đã build
    const { count, rows: reports } = await Report.findAndCountAll({
      where: whereClause,
      limit: limit,
      offset: offset,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: User,
          as: 'user', 
          attributes: ['id', 'full_name', 'avatar_url'] 
        }
      ]
    });

    let responseData = reports.map(r => r.toJSON());

    // 4. Map trạng thái Vote của User hiện tại
    if (user_id && reports.length > 0) {
      const userVotes = await ReportVote.findAll({ 
        where: { user_id, report_id: reports.map(r => r.id) } 
      });
      const voteMap = new Map(userVotes.map(v => [v.report_id, v.type]));
      
      responseData = responseData.map(report => ({
        ...report,
        current_user_vote: voteMap.get(report.id) || null 
      }));
    } else {
      responseData = responseData.map(report => ({ ...report, current_user_vote: null }));
    }

    // 5. Tính toán dữ liệu phân trang (Meta Data)
    const totalPages = Math.ceil(count / limit);
    const meta = {
      current_page: page,
      total_pages: totalPages,
      total_items: count,
      limit: limit,
      has_next: page < totalPages,
      has_previous: page > 1
    };

    return res.status(200).json({ 
      success: true, 
      meta: meta, 
      data: responseData 
    });

  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// 3. Admin duyệt hoặc từ chối báo cáo
export const updateReportStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; 
    const { status } = req.body; 

    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
    }

    const report = await Report.findByPk(Number(id));
    if (!report) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy báo cáo' });
    }

    report.status = status as 'verified' | 'rejected';
    await report.save();

    if (status === 'verified' && io) {
      io.emit('flood_verified', report); 
    }

    return res.status(200).json({ success: true, message: 'Cập nhật thành công', data: report });

  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// 4. Lấy danh sách điểm ngập trong bán kính (Có kèm trạng thái Vote)
export const getReportsNearby = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const user_id = authReq.user?.id;
    const { lat, long, radius } = req.query;

    if (!lat || !long) {
      return res.status(400).json({ success: false, message: 'Thiếu tọa độ lat, long' });
    }

    const r = radius ? parseFloat(radius as string) : 5; 
    const userLat = parseFloat(lat as string);
    const userLong = parseFloat(long as string);

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

    let responseData = reports.map(r => r.toJSON());

    // Map trạng thái Vote cho báo cáo gần đây
    if (user_id) {
      const userVotes = await ReportVote.findAll({ where: { user_id } });
      const voteMap = new Map(userVotes.map(v => [v.report_id, v.type]));
      
      responseData = responseData.map(report => ({
        ...report,
        current_user_vote: voteMap.get(report.id) || null 
      }));
    } else {
      responseData = responseData.map(report => ({ ...report, current_user_vote: null }));
    }

    return res.status(200).json({ success: true, count: responseData.length, data: responseData });

  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// 5. Xử lý Upvote / Downvote báo cáo
export const voteReport = async (req: Request, res: Response) => {
  // Bật Transaction để đảm bảo tính nhất quán dữ liệu nếu có lỗi giữa chừng
  const t = await sequelize.transaction();
  try {
    const authReq = req as AuthRequest;
    const user_id = authReq.user?.id;
    const { id } = req.params; 
    const { type } = req.body; 

    if (!user_id) return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    if (!['upvote', 'downvote'].includes(type)) return res.status(400).json({ success: false, message: 'Loại vote không hợp lệ' });

    const report = await Report.findByPk(Number(id), { transaction: t });
    if (!report) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Không tìm thấy báo cáo' });
    }

    // Kiểm tra user đã vote bài này chưa
    const existingVote = await ReportVote.findOne({ where: { report_id: id, user_id }, transaction: t });

    if (existingVote) {
      if (existingVote.type === type) {
        // Bấm lại nút đang chọn -> Hủy vote
        await existingVote.destroy({ transaction: t });
        type === 'upvote' ? report.upvotes -= 1 : report.downvotes -= 1;
      } else {
        // Đổi từ upvote sang downvote (hoặc ngược lại)
        existingVote.type = type;
        await existingVote.save({ transaction: t });
        if (type === 'upvote') {
          report.upvotes += 1;
          report.downvotes -= 1;
        } else {
          report.downvotes += 1;
          report.upvotes -= 1;
        }
      }
    } else {
      // Bấm lần đầu
      await ReportVote.create({ report_id: Number(id), user_id, type }, { transaction: t });
      type === 'upvote' ? report.upvotes += 1 : report.downvotes += 1;
    }

    // Phòng hờ dữ liệu âm
    if (report.upvotes < 0) report.upvotes = 0;
    if (report.downvotes < 0) report.downvotes = 0;

    await report.save({ transaction: t });
    await t.commit();

    // Bắn dữ liệu Real-time
    if (io) {
      io.emit('report_voted', { 
        report_id: report.id, 
        upvotes: report.upvotes, 
        downvotes: report.downvotes 
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Vote thành công',
      data: { upvotes: report.upvotes, downvotes: report.downvotes } 
    });

  } catch (error: any) {
    await t.rollback();
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ADMIN ----------------------------------------------------
// [Admin] Xóa báo cáo
export const deleteReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const report = await Report.findByPk(Number(id));
    if (!report) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy báo cáo' });
    }

    // Xóa báo cáo trong Database
    // Ghi chú: Nếu muốn cẩn thận hơn, bạn có thể viết thêm logic xóa ảnh trên Firebase Storage tương ứng với report.images
    await report.destroy();

    return res.status(200).json({
      success: true,
      message: 'Đã xóa báo cáo thành công'
    });

  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};