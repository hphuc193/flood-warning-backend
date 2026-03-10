import { Request, Response } from 'express';

// Master Data: Cẩm nang hướng dẫn sơ tán (7 bước theo tài liệu PCTT)
const EVACUATION_GUIDE = [
  {
    step: 1,
    title: 'Khi nào cần sơ tán?',
    description: 'Theo dõi mức cảnh báo lũ. Sơ tán ngay lập tức khi có lệnh từ chính quyền địa phương hoặc khi nước bắt đầu dâng vào nhà. Không chần chừ tiếc tài sản.',
    icon: 'warning_icon',
    video_url: 'https://youtu.be/YF9ktYD9l3g?si=oXANts3HnxSJRylv', // Link video tutorial trên Youtube/Firebase
    type: 'info'
  },
  {
    step: 2,
    title: 'Chuẩn bị gì trước khi đi',
    description: 'Mang theo Emergency Kit (Balo cứu sinh). Bao gồm: Giấy tờ tùy thân (bọc túi nilon), thuốc men, nước uống, đồ ăn khô, đèn pin và sạc dự phòng.',
    icon: 'backpack_icon',
    video_url: 'https://youtu.be/3qDU5tGW930?si=zgmwWzPQbn_54PXR',
    type: 'checklist_reference' // Gợi ý app mở màn hình Checklist
  },
  {
    step: 3,
    title: 'Xác định đường đi & Nơi trú ẩn',
    description: 'Mở bản đồ Interactive Map trên ứng dụng để tìm tuyến đường an toàn cao ráo nhất đến nơi trú ẩn gần nhất. Tuyệt đối không đi đường tắt qua ngầm tràn.',
    icon: 'map_icon',
    video_url: null,
    type: 'map_reference' // Gợi ý app mở màn hình Bản đồ
  },
  {
    step: 4,
    title: 'Phương tiện di chuyển',
    description: 'Ưu tiên đi bộ nếu nước nông, dùng gậy để dò đường. Nếu nước sâu, đợi xuồng cứu hộ. Tuyệt đối không cố lái xe máy hoặc ô tô qua vùng nước ngập ngang bánh xe.',
    icon: 'transport_icon',
    video_url: 'https://youtu.be/PdSxmOGiVe4?si=_xCUasyh06CnB8KG',
    type: 'info'
  },
  {
    step: 5,
    title: 'Quy tắc an toàn trên đường đi',
    description: '1. KHÔNG đi qua dòng nước chảy xiết (chỉ 15cm nước xiết có thể làm ngã người).\n2. TRÁNH XA cột điện, dây điện đứt lềnh bềnh trên mặt nước.\n3. Tránh nắp cống bị trôi.',
    icon: 'health_and_safety_icon',
    video_url: 'https://youtu.be/uvU40iN_enw?si=bJEXzpxOl0L6z65L',
    type: 'warning'
  },
  {
    step: 6,
    title: 'Liên hệ cứu hộ khẩn cấp',
    description: 'Nếu mắc kẹt, di chuyển lên vị trí cao nhất có thể (mái nhà). Gọi ngay số 112 (Cứu nạn) hoặc dùng chức năng SOS trên ứng dụng để gửi tọa độ.',
    icon: 'sos_icon',
    video_url: null,
    type: 'sos_reference'
  },
  {
    step: 7,
    title: 'Thủ tục khi đến nơi trú ẩn',
    description: 'Khai báo y tế và thông tin cá nhân với ban quản lý. Tuân thủ nội quy sinh hoạt chung, tiết kiệm điện nước và giữ gìn vệ sinh phòng dịch.',
    icon: 'shelter_icon',
    video_url: null,
    type: 'info'
  }
];

export const getEvacuationGuide = async (req: Request, res: Response) => {
  try {
    return res.status(200).json({
      success: true,
      message: 'Lấy hướng dẫn sơ tán thành công',
      data: EVACUATION_GUIDE
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};