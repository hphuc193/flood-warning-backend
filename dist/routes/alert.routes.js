"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const alert_controller_1 = require("../controllers/alert.controller");
const router = (0, express_1.Router)();
router.post('/', alert_controller_1.createAlert); // Tạo alert
router.get('/active', alert_controller_1.getActiveAlerts); // Lấy alert đang chạy
router.put('/:id/resolve', alert_controller_1.resolveAlert); // Kết thúc alert (Admin)
exports.default = router;
