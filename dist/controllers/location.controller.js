"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNearbyLocations = exports.getAllLocations = exports.createLocation = void 0;
const Location_1 = __importDefault(require("../models/Location"));
const database_1 = require("../config/database");
// 1. API: Thêm địa điểm mới (Admin/Seed data)
const createLocation = async (req, res) => {
    try {
        const { name, description, address, type, lat, long } = req.body;
        // Validate cơ bản
        if (!lat || !long) {
            return res.status(400).json({ success: false, message: 'Thiếu tọa độ lat/long' });
        }
        const newLocation = await Location_1.default.create({
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
    }
    catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};
exports.createLocation = createLocation;
// 2. API: Lấy tất cả địa điểm
const getAllLocations = async (req, res) => {
    try {
        const locations = await Location_1.default.findAll();
        return res.status(200).json({ success: true, data: locations });
    }
    catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};
exports.getAllLocations = getAllLocations;
// 3. API: Tìm địa điểm gần nhất (GIS Feature)
// Query params: ?lat=10.8&long=106.6&radius=5000 (mét)
const getNearbyLocations = async (req, res) => {
    try {
        const { lat, long, radius } = req.query;
        if (!lat || !long) {
            return res.status(400).json({ success: false, message: 'Cần truyền lat và long' });
        }
        const distanceInMeters = radius ? parseInt(radius) : 10000; // Mặc định 10km
        // Sử dụng sức mạnh của PostGIS với Sequelize Literal
        const locations = await Location_1.default.findAll({
            where: database_1.sequelize.literal(`
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
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, error: error.message });
    }
};
exports.getNearbyLocations = getNearbyLocations;
