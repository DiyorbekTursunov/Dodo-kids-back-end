// swagger.config.ts (updated)
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUiExpress from "swagger-ui-express";
import authPaths from "./swagger/swagger.auth.paths"; // Import the auth paths
import colorPaths from "./swagger/swagger.colors.paths";

const swaggerDefinition = {
    openapi: "3.0.0",
    info: {
        title: "Dodo Kids Auth API",
        version: "1.0.0",
        description:
            "API documentation for the authentication endpoints of Dodo Kids application",
    },
    servers: [
        {
            url: `https://dodo-kids-back-end-xq7q.onrender.com`,
            description: "render.com server",
        },
        {
            url: `http://localhost:${process.env.PORT || 3000}/api`,
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
            ErrorResponse: {
                type: "object",
                properties: {
                    error: { type: "string", example: "Error message" },
                },
            },
        },
    },
    ...authPaths, // Merge the auth paths here
};

const options = {
  swaggerDefinition,
  apis: [], // Add other route files here if you use JSDoc annotations
};

export const specs = swaggerJSDoc(options);
export const swaggerUi = swaggerUiExpress;
