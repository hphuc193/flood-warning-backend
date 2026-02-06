import swaggerJsdoc from 'swagger-jsdoc';

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

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;