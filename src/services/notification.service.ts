import { firebaseMessaging } from '../config/firebase';
import User from '../models/User';
import Alert from '../models/Alert';
import { Op } from 'sequelize';

// ============================================================================
// 1. GỬI THÔNG BÁO HÀNG LOẠT (BROADCAST) - Dùng cho cảnh báo khẩn cấp chung
// ============================================================================
export const sendAlertNotification = async (alert: Alert) => {
  try {
    // Lấy danh sách token của người dùng (những người có fcm_token)
    // *Nâng cao: Sau này có thể lọc user đang ở gần vị trí cảnh báo (dùng PostGIS)
    const users = await User.findAll({
      where: {
        fcm_token: { [Op.ne]: null as any } 
      },
      attributes: ['fcm_token']
    });

    const tokens = users.map(u => u.fcm_token);

    if (tokens.length === 0) {
      console.log('⚠️ Không có user nào để gửi thông báo.');
      return;
    }

    const message = {
      notification: {
        title: `⚠️ CẢNH BÁO: ${alert.title}`,
        body: alert.description.substring(0, 100) + '...' 
      },
      data: {
        type: 'ALERT',
        alertId: alert.id.toString(),
        severity: alert.severity.toString() // Lưu ý: Firebase data payload chỉ nhận kiểu chuỗi (string)
      },
      tokens: tokens as string[] 
    };

    // Gửi qua Firebase (Multicast)
    const response = await firebaseMessaging.sendEachForMulticast(message);
    
    console.log(`✅ Đã gửi thông báo khẩn cấp thành công: ${response.successCount}/${tokens.length} thiết bị.`);
    
    if (response.failureCount > 0) {
      console.log('❌ Một số tin nhắn gửi thất bại:', response.responses);
    }

  } catch (error) {
    console.error('❌ Lỗi khi gửi FCM Broadcast:', error);
  }
};

// ============================================================================
// 2. GỬI THÔNG BÁO CÁ NHÂN (UNICAST) - Dùng cho thời tiết hoặc thông báo 1-1
// ============================================================================
export const sendPushNotification = async (fcmToken: string, title: string, body: string, dataPayload?: any) => {
  if (!fcmToken) return false;

  const message = {
    notification: {
      title: title,
      body: body,
    },
    // Nếu có truyền thêm data ẩn để App xử lý (ví dụ: mở màn hình thời tiết) thì nhét vào đây
    data: dataPayload || { type: 'WEATHER_DAILY' },
    token: fcmToken,
  };

  try {
    // Sử dụng send() thay vì sendEachForMulticast() vì chỉ gửi cho 1 token
    await firebaseMessaging.send(message);
    return true;
  } catch (error: any) {
    console.error(`❌ Lỗi gửi FCM Unicast cho token ${fcmToken}:`, error.message);
    
    // Tối ưu hóa Database: Nếu Firebase báo lỗi token này đã bị gỡ app hoặc hết hạn, ta có thể xóa nó đi
    if (error.code === 'messaging/registration-token-not-registered' || error.code === 'messaging/invalid-registration-token') {
      console.log(`🗑️ Đang xóa token không hợp lệ khỏi Database...`);
      await User.update({ fcm_token: '' }, { where: { fcm_token: fcmToken } });
    }
    
    return false;
  }
};