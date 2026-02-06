"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Flood Warning System API',
            version: '1.0.0',
            description: 'Tài liệu API cho hệ thống cảnh báo lũ lụt',
            contact: {
                name: 'Developer',
                email: 'your-email@example.com',
            },
        },
        servers: [
            {
                url: 'http://localhost:3000/api/v1',
                description: 'Local Development Server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    // Chỉ định nơi chứa các file code cần quét tài liệu (Routes và Models)
    apis: ['./src/routes/*.ts', './src/models/*.ts'],
};
const swaggerSpec = (0, swagger_jsdoc_1.default)(options);
exports.default = swaggerSpec;
