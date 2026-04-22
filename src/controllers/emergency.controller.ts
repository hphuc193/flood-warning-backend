import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import EmergencyContact from '../models/EmergencyContact';
import LocalContact from '../models/LocalContact';
import { Sequelize, Op } from 'sequelize';

// Master Data: Danh bạ khẩn cấp quốc gia & dịch vụ thiết yếu
const SYSTEM_CONTACTS = [
  {
    id: 'sys_113',
    name: 'Cảnh sát / Công an',
    phone_number: '113',
    description: 'Gọi khi có nguy hiểm về an ninh, trật tự, tội phạm.',
    has_sms_template: true,
    sms_template_content: 'Tôi đang gặp nguy hiểm cần cảnh sát can thiệp tại tọa độ: [TỌA_ĐỘ]. Xin cứu giúp!'
  },
  {
    id: 'sys_114',
    name: 'Cứu hỏa / Cứu hộ cứu nạn',
    phone_number: '114',
    description: 'Gọi khi có cháy nổ, mắc kẹt trong lũ lụt, sạt lở đất.',
    has_sms_template: true,
    sms_template_content: 'Tôi đang bị mắc kẹt do lũ lụt/sạt lở tại: [TỌA_ĐỘ]. Xung quanh có [SỐ_LƯỢNG] người. Cần cứu hộ khẩn cấp!'
  },
  {
    id: 'sys_115',
    name: 'Cấp cứu Y tế',
    phone_number: '115',
    description: 'Gọi khi có người bị thương, tai nạn, đuối nước cần sơ cứu.',
    has_sms_template: true,
    sms_template_content: 'Cần xe cấp cứu y tế gấp tại: [TỌA_ĐỘ]. Tình trạng nạn nhân: [TÌNH_TRẠNG].'
  },
  {
    id: 'sys_dienluc',
    name: 'Tổng đài Điện lực (EVN)',
    phone_number: '19001909',
    description: 'Gọi báo cắt điện khẩn cấp khi nước dâng cao rò rỉ điện.',
    has_sms_template: false,
  },
  {
    id: 'sys_capnuoc',
    name: 'Tổng đài Cấp nước',
    phone_number: '19006008',
    description: 'Gọi khi vỡ ống nước, cần hỗ trợ cung cấp nước sạch.',
    has_sms_template: false,
  }
];

// 1. Lấy toàn bộ danh bạ (Hệ thống + Cá nhân của user)
export const getContacts = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const user_id = authReq.user?.id;
    
    // Lấy tọa độ User truyền lên từ query (nếu có)
    const lat = req.query.lat as string;
    const long = req.query.long as string;

    // 1. Lấy danh bạ cá nhân
    const customContacts = await EmergencyContact.findAll({
      where: { user_id },
      attributes: ['id', 'name', 'phone_number', 'relation']
    });

    // 2. Lấy danh bạ địa phương gần nhất (Bán kính 30km)
    let localContacts: any[] = [];
    if (lat && long) {
      const radiusInMeters = 30000; // 30km
      const pointQuery = `ST_SetSRID(ST_MakePoint(${parseFloat(long)}, ${parseFloat(lat)}), 4326)::geography`;

      const nearestLocal = await LocalContact.findAll({
        where: {
          is_active: true,
          [Op.and]: Sequelize.literal(`ST_DWithin(location::geography, ${pointQuery}, ${radiusInMeters})`)
        },
        attributes: {
          include: [
            // Tính khoảng cách (mét) để Mobile hiện ra "Cách 3.5km"
            [Sequelize.literal(`ST_Distance(location::geography, ${pointQuery})`), 'distance']
          ]
        },
        order: Sequelize.literal('distance ASC'), // Sắp xếp cái nào gần nhất lên đầu
        limit: 5 // Trả về tối đa 5 cơ quan gần nhất để không làm rối UI
      });

      // Format lại dữ liệu trả về
      localContacts = nearestLocal.map(loc => {
        // THÊM "as any" VÀO DÒNG NÀY ĐỂ ÉP KIỂU:
        const data = loc.toJSON() as any; 
        
        return {
          id: `local_${data.id}`,
          name: data.name,
          phone_number: data.phone_number,
          description: data.description,
          province: data.province,
          distance_km: (data.distance / 1000).toFixed(1), // Hết báo lỗi!
          lat: data.location.coordinates[1],
          long: data.location.coordinates[0],
        };
      });
    }

    // 3. Gộp trả về 3 loại danh bạ
    return res.status(200).json({
      success: true,
      data: {
        system_contacts: SYSTEM_CONTACTS,
        local_contacts: localContacts, // Thêm mảng này
        custom_contacts: customContacts
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// 2. Thêm danh bạ cá nhân (Người thân, Bạn bè)
export const addCustomContact = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const user_id = authReq.user?.id;
    const { name, phone_number, relation } = req.body;

    if (!name || !phone_number) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập tên và số điện thoại' });
    }

    const newContact = await EmergencyContact.create({
      user_id: user_id as number,
      name,
      phone_number,
      relation
    });

    return res.status(201).json({ success: true, message: 'Đã thêm số điện thoại khẩn cấp', data: newContact });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// 3. Xóa danh bạ cá nhân
export const deleteCustomContact = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const user_id = authReq.user?.id;
    const contact_id = req.params.id;

    const deleted = await EmergencyContact.destroy({
      where: { id: contact_id, user_id }
    });

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy liên hệ này' });
    }

    return res.status(200).json({ success: true, message: 'Đã xóa liên hệ thành công' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// 1. [Admin] Lấy danh sách toàn bộ số địa phương
export const getAllLocalContacts = async (req: Request, res: Response) => {
  try {
    const contacts = await LocalContact.findAll({ order: [['province', 'ASC'], ['name', 'ASC']] });
    
    // Format tọa độ cho dễ đọc
    const formatted = contacts.map(c => {
      const data = c.toJSON();
      return {
        ...data,
        lat: data.location.coordinates[1],
        long: data.location.coordinates[0],
      };
    });

    return res.status(200).json({ success: true, data: formatted });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// 2. [Admin] Thêm mới số địa phương
export const createLocalContact = async (req: Request, res: Response) => {
  try {
    const { name, phone_number, description, province, lat, long } = req.body;

    if (!name || !phone_number || !lat || !long || !province) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
    }

    const newContact = await LocalContact.create({
      name,
      phone_number,
      description,
      province,
      location: { type: 'Point', coordinates: [parseFloat(long), parseFloat(lat)] }
    });

    return res.status(201).json({ success: true, message: 'Đã thêm danh bạ địa phương', data: newContact });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// 3. [Admin] Xóa số địa phương
export const deleteLocalContact = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await LocalContact.destroy({ where: { id } });
    return res.status(200).json({ success: true, message: 'Đã xóa thành công' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};