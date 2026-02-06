import { firebaseMessaging } from '../config/firebase';
import User from '../models/User';
import Alert from '../models/Alert';
import { Op } from 'sequelize';

// Hàm gửi thông báo cảnh báo đến người dùng
export const sendAlertNotification = async (alert: Alert) => {
  try {
    // 1. Lấy danh sách token của người dùng (những người có fcm_token)
    // *Nâng cao: Sau này có thể lọc user đang ở gần vị trí cảnh báo (dùng PostGIS)
    const users = await User.findAll({
      where: {
        fcm_token: { [Op.ne]: null as any } // Lấy user đã có token
      },
      attributes: ['fcm_token']
    });

    const tokens = users.map(u => u.fcm_token);

    if (tokens.length === 0) {
      console.log('⚠️ Không có user nào để gửi thông báo.');
      return;
    }

    // 2. Cấu hình nội dung thông báo
    const message = {
      notification: {
        title: `⚠️ CẢNH BÁO: ${alert.title}`,
        body: alert.description.substring(0, 100) + '...' // Cắt ngắn nếu dài quá
      },
      data: {
        type: 'ALERT',
        alertId: alert.id.toString(),
        severity: alert.severity
      },
      tokens: tokens as string[] // Gửi cho danh sách token
    };

    // 3. Gửi qua Firebase
    const response = await firebaseMessaging.sendEachForMulticast(message);
    
    console.log(`✅ Đã gửi thông báo thành công: ${response.successCount}/${tokens.length} thiết bị.`);
    
    if (response.failureCount > 0) {
      console.log('❌ Một số tin nhắn gửi thất bại:', response.responses);
    }

  } catch (error) {
    console.error('❌ Lỗi khi gửi FCM:', error);
  }
};