"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const report_controller_1 = require("../controllers/report.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Cấu hình Multer: Lưu file vào RAM tạm thời trước khi đẩy lên Firebase
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // Giới hạn 5MB
});
// Endpoint
router.post('/', auth_middleware_1.verifyToken, upload.array('images', 5), report_controller_1.createReport);
router.get('/', auth_middleware_1.verifyToken, report_controller_1.getReports);
exports.default = router;
