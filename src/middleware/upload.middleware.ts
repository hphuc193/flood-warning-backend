import multer from 'multer';

// Sử dụng RAM (Memory) để lưu file đệm, giúp xử lý Stream trực tiếp lên Firebase cực nhanh
const storage = multer.memoryStorage();

// Bộ lọc bảo mật: Chỉ cho phép định dạng hình ảnh
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Định dạng file không hợp lệ. Chỉ chấp nhận hình ảnh!'));
  }
};

export const uploadAvatarMiddleware = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Giới hạn kích thước file tối đa là 5MB
  },
  fileFilter: fileFilter,
});