// swagger.config.ts
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUiExpress from "swagger-ui-express";
import authPaths from "./swagger/swagger.auth.paths";
import colorPaths from "./swagger/swagger.colors.paths";
import sizePaths from "./swagger/swagger.size.paths";

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Dodo Kids API",
    version: "1.0.0",
    description: "API documentation for Dodo Kids application",
  },
  servers: [
    {
      url: "https://dodo-kids-back-end-xq7q.onrender.com",
      description: "render.com server",
    },
    {
      url: `http://localhost:${process.env.PORT || 3000}`,
      description: "Local server",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      // Authentication schemas
      LoginRequest: {
        type: "object",
        required: ["login", "password"],
        properties: {
          login: { type: "string", example: "user" },
          password: { type: "string", example: "password123" },
        },
      },
      RegisterRequest: {
        type: "object",
        required: ["login", "password", "role", "departmentId"],
        properties: {
          login: { type: "string", example: "user" },
          password: { type: "string", example: "password123" },
          role: { type: "string", example: "admin" },
          departmentId: { type: "string", example: "1" },
        },
      },
      RefreshTokenRequest: {
        type: "object",
        required: ["refreshToken"],
        properties: {
          refreshToken: { type: "string", example: "your-refresh-token" },
        },
      },
      UserResponse: {
        type: "object",
        properties: {
          message: {
            type: "string",
            example: "User information retrieved successfully",
          },
          user: {
            type: "object",
            properties: {
              id: { type: "string", example: "1" },
              login: { type: "string", example: "user" },
              role: { type: "string", example: "admin" },
              employee: { type: "object", additionalProperties: true },
            },
          },
        },
      },
      // Color schemas
      ColorRequest: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string", example: "Red" },
        },
      },
      Color: {
        type: "object",
        properties: {
          id: { type: "string", example: "1" },
          name: { type: "string", example: "Red" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      // Size schemas
      SizeRequest: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string", example: "Medium" },
        },
      },
      Size: {
        type: "object",
        properties: {
          id: { type: "string", example: "1" },
          name: { type: "string", example: "Medium" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      // Common schemas
      ErrorResponse: {
        type: "object",
        properties: {
          error: { type: "string", example: "Error message" },
        },
      },
      SuccessResponse: {
        type: "object",
        properties: {
          message: { type: "string", example: "Operation completed successfully" },
        },
      },
    },
  },
  paths: {
    ...authPaths.paths,
    ...colorPaths.paths,
    ...sizePaths.paths,
  },
};

const options = {
  swaggerDefinition,
  apis: [],
};

export const specs = swaggerJSDoc(options);
export const swaggerUi = swaggerUiExpress;
