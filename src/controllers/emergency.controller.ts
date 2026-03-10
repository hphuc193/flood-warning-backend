import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import EmergencyContact from '../models/EmergencyContact';

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

    // Lấy danh bạ người dùng tự thêm từ Database
    const customContacts = await EmergencyContact.findAll({
      where: { user_id },
      attributes: ['id', 'name', 'phone_number', 'relation']
    });

    return res.status(200).json({
      success: true,
      data: {
        system_contacts: SYSTEM_CONTACTS,
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