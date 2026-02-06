"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = require("./config/database");
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = require("http");
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_1 = __importDefault(require("./config/swagger"));
const report_routes_1 = __importDefault(require("./routes/report.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const location_routes_1 = __importDefault(require("./routes/location.routes"));
const weather_routes_1 = __importDefault(require("./routes/weather.routes"));
const alert_routes_1 = __importDefault(require("./routes/alert.routes"));
const socket_service_1 = __importDefault(require("./services/socket.service"));
require("./models/User");
require("./models/Location");
require("./models/WeatherData");
require("./models/Alert");
require("./models/Report");
dotenv_1.default.config();
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const PORT = process.env.PORT || 3000;
// Socket.io
socket_service_1.default.init(httpServer);
// Middleware
app.use(express_1.default.json());
// Đăng ký Routes
app.use('/api/v1/auth', auth_routes_1.default);
app.use('/api/v1/locations', location_routes_1.default);
app.use('/api/v1/weather', weather_routes_1.default);
app.use('/api/v1/alerts', alert_routes_1.default);
app.use('/api/v1/reports', report_routes_1.default);
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.default));
console.log('📄 Swagger Docs available at http://localhost:3000/api-docs');
// Khởi động Server
const startServer = async () => {
    // Kết nối Database trước khi listen port
    await (0, database_1.connectDB)();
    await database_1.sequelize.sync({ alter: true });
    // Đồng bộ Model với Database (Dùng trong dev, production nên dùng Migration)
    // alter: true giúp cập nhật bảng nếu có thay đổi model mà không xóa dữ liệu
    await database_1.sequelize.sync({ alter: true });
    console.log('Database synchronized.');
    httpServer.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
        console.log(`Socket.io is ready for connections`);
    });
};
startServer();
