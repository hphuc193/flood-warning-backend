"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const location_controller_1 = require("../controllers/location.controller");
const router = (0, express_1.Router)();
// Định nghĩa các endpoint
router.post('/', location_controller_1.createLocation); // Tạo mới
router.get('/', location_controller_1.getAllLocations); // Lấy tất cả
router.get('/nearby', location_controller_1.getNearbyLocations); // Tìm gần đây (Đặt trước /:id để tránh trùng)
exports.default = router;
