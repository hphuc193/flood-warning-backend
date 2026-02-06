import { Request, Response } from 'express';
import Location from '../models/Location';
import { sequelize } from '../config/database';

// 1. API: Thêm địa điểm mới (Admin/Seed data)
export const createLocation = async (req: Request, res: Response) => {
  try {
    const { name, description, address, type, lat, long } = req.body;

    // Validate cơ bản
    if (!lat || !long) {
      return res.status(400).json({ success: false, message: 'Thiếu tọa độ lat/long' });
    }

    const newLocation = await Location.create({
      name,
      description,
      address,
      type,
      // Tạo GeoJSON Point cho PostGIS
      coordinates: { type: 'Point', coordinates: [long, lat] } 
    });

    return res.status(201).json({
      success: true,
      data: newLocation
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// 2. API: Lấy tất cả địa điểm
export const getAllLocations = async (req: Request, res: Response) => {
  try {
    const locations = await Location.findAll();
    return res.status(200).json({ success: true, data: locations });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// 3. API: Tìm địa điểm gần nhất (GIS Feature)
// Query params: ?lat=10.8&long=106.6&radius=5000 (mét)
export const getNearbyLocations = async (req: Request, res: Response) => {
  try {
    const { lat, long, radius } = req.query;

    if (!lat || !long) {
      return res.status(400).json({ success: false, message: 'Cần truyền lat và long' });
    }

    const distanceInMeters = radius ? parseInt(radius as string) : 10000; // Mặc định 10km

    // Sử dụng sức mạnh của PostGIS với Sequelize Literal
    const locations = await Location.findAll({
      where: sequelize.literal(`
        ST_DWithin(
          coordinates,
          ST_MakePoint(${long}, ${lat})::geography,
          ${distanceInMeters}
        )
      `)
    });

    return res.status(200).json({
      success: true,
      count: locations.length,
      data: locations
    });

  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ success: false, error: error.message });
  }
};