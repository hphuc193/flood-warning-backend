import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';

class SocketService {
  private static instance: SocketService;
  private io: SocketIOServer | null = null;

  private constructor() {}

  // Singleton Pattern: Đảm bảo chỉ có 1 instance duy nhất chạy
  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  // Khởi tạo Socket.io gắn vào HTTP Server
  public init(httpServer: HttpServer): void {
    this.io = new SocketIOServer(httpServer, {
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
  public emit(event: string, data: any): void {
    if (this.io) {
      this.io.emit(event, data);
    }
  }

  // Hàm gửi sự kiện riêng cho từng khu vực (Room)
  public emitToLocation(locationId: number, event: string, data: any): void {
    if (this.io) {
      this.io.to(`location_${locationId}`).emit(event, data);
    }
  }
}

export default SocketService.getInstance();