"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReports = exports.createReport = void 0;
const Report_1 = __importDefault(require("../models/Report"));
const firebase_1 = require("../config/firebase");
const uuid_1 = require("uuid");
// 1. Tạo báo cáo mới
const createReport = async (req, res) => {
    try {
        const { user_id, lat, long, description } = req.body;
        const files = req.files;
        if (!user_id || !lat || !long) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin user_id, lat hoặc long' });
        }
        const imageUrls = [];
        // Xử lý upload lên Firebase
        if (files && files.length > 0) {
            for (const file of files) {
                // Tạo tên file ngẫu nhiên để không bị trùng
                const filename = `reports/${(0, uuid_1.v4)()}_${file.originalname}`;
                const blob = firebase_1.firebaseStorage.file(filename);
                const blobStream = blob.createWriteStream({
                    metadata: { contentType: file.mimetype }
                });
                await new Promise((resolve, reject) => {
                    blobStream.on('error', (err) => reject(err));
                    blobStream.on('finish', () => resolve(true));
                    blobStream.end(file.buffer);
                });
                // Lấy đường dẫn (Signed URL) - Hạn dùng 100 năm
                const [url] = await blob.getSignedUrl({
                    action: 'read',
                    expires: '01-01-2100'
                });
                imageUrls.push(url);
            }
        }
        // Lưu vào Database
        const newReport = await Report_1.default.create({
            user_id: user_id, // Ép kiểu về số
            lat: parseFloat(lat),
            long: parseFloat(long),
            description,
            images: imageUrls
        });
        return res.status(201).json({ success: true, data: newReport });
    }
    catch (error) {
        console.error('Upload Error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
};
exports.createReport = createReport;
// get list report 
const getReports = async (req, res) => {
    try {
        const reports = await Report_1.default.findAll({
            order: [['created_at', 'DESC']]
        });
        return res.status(200).json({ success: true, data: reports });
    }
    catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};
exports.getReports = getReports;
