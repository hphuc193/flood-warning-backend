"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_1 = require("socket.io");
class SocketService {
    constructor() {
        this.io = null;
    }
    // Singleton Pattern: Đảm bảo chỉ có 1 instance duy nhất chạy
    static getInstance() {
        if (!SocketService.instance) {
            SocketService.instance = new SocketService();
        }
        return SocketService.instance;
    }
    // Khởi tạo Socket.io gắn vào HTTP Server
    init(httpServer) {
        this.io = new socket_io_1.Server(httpServer, {
            cors: {
                origin: "*", // Cho phép mọi Client kết nối (App, Web)
                methods: ["GET", "POST"]
            }
        });
        this.io.on('connection', (socket) => {
            console.log(`🔌 Client connected: ${socket.id}`);
            // Client có thể join vào các "phòng" (room) cụ thể
            // Ví dụ: User ở Đà Nẵng chỉ join room 'location_1' để nghe tin về Đà Nẵng
            socket.on('join_location', (locationId) => {
                socket.join(`location_${locationId}`);
                console.log(`User ${socket.id} joined room location_${locationId}`);
            });
            socket.on('disconnect', () => {
                console.log(`Client disconnected: ${socket.id}`);
            });
        });
        console.log('✅ Socket.io Initialized');
    }
    // Hàm gửi sự kiện cho toàn bộ client
    emit(event, data) {
        if (this.io) {
            this.io.emit(event, data);
        }
    }
    // Hàm gửi sự kiện riêng cho từng khu vực (Room)
    emitToLocation(locationId, event, data) {
        if (this.io) {
            this.io.to(`location_${locationId}`).emit(event, data);
        }
    }
}
exports.default = SocketService.getInstance();
