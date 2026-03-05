import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import UserLocation from '../models/UserLocation';

// 1. Tạo vị trí quan tâm mới
export const createLocation = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const user_id = authReq.user?.id;
    const { name, lat, long, radius, priority, is_active } = req.body;

    if (!name || lat === undefined || long === undefined) {
      return res.status(400).json({ success: false, message: 'Thiếu tên hoặc tọa độ' });
    }

    const newLocation = await UserLocation.create({
      user_id,
      name,
      // Chuyển đổi lat/long thành chuẩn GEOMETRY của PostGIS
      coordinates: { type: 'Point', coordinates: [parseFloat(long), parseFloat(lat)] },
      radius: radius ? parseFloat(radius) : 5,
      priority: priority || 'medium',
      is_active: is_active !== undefined ? is_active : true,
    });

    return res.status(201).json({ success: true, data: newLocation });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// 2. Lấy danh sách vị trí đã lưu của User
export const getMyLocations = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const user_id = authReq.user?.id;

    const locations = await UserLocation.findAll({
      where: { user_id },
      order: [['created_at', 'DESC']]
    });

    // Format lại dữ liệu trả về cho Frontend dễ dùng (tách tọa độ)
    const formattedData = locations.map(loc => {
      const data = loc.toJSON();
      return {
        ...data,
        lat: data.coordinates.coordinates[1],
        long: data.coordinates.coordinates[0],
        coordinates: undefined // Giấu chuỗi GEOMETRY đi
      };
    });

    return res.status(200).json({ success: true, data: formattedData });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// 3. Cập nhật vị trí (Đổi tên, đổi bán kính, bật/tắt thông báo)
export const updateLocation = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const user_id = authReq.user?.id;
    const { id } = req.params;
    const { name, radius, priority, is_active } = req.body;

    const location = await UserLocation.findOne({ where: { id, user_id } });
    
    if (!location) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy vị trí' });
    }

    if (name) location.name = name;
    if (radius) location.radius = parseFloat(radius);
    if (priority) location.priority = priority;
    if (is_active !== undefined) location.is_active = is_active;

    await location.save();
    return res.status(200).json({ success: true, message: 'Cập nhật thành công', data: location });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// 4. Xóa vị trí
export const deleteLocation = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const user_id = authReq.user?.id;
    const { id } = req.params;

    const deletedCount = await UserLocation.destroy({ where: { id, user_id } });
    
    if (deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy vị trí hoặc không có quyền xóa' });
    }

    return res.status(200).json({ success: true, message: 'Xóa vị trí thành công' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};