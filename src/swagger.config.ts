import swaggerJSDoc from "swagger-jsdoc";
import swaggerUiExpress from "swagger-ui-express";
import authPaths from "./swagger/swagger.auth.paths";
import colorPaths from "./swagger/swagger.colors.paths";
import sizePaths from "./swagger/swagger.size.paths";
import dashboardPaths from "./swagger/swagger.dashboard.paths"; // Add new paths

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
      // Existing schemas
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
      // New schemas for dashboard endpoints
      DateRangeRequest: {
        type: "object",
        properties: {
          startDate: {
            type: "string",
            format: "date",
            example: "2025-06-01",
            nullable: true,
          },
          endDate: {
            type: "string",
            format: "date",
            example: "2025-06-04",
            nullable: true,
          },
        },
      },
      DashboardStatsResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            properties: {
              totalProductPacks: { type: "integer", example: 10 },
              overallStats: {
                type: "object",
                properties: {
                  sendedCount: { type: "integer", example: 500 },
                  invalidCount: { type: "integer", example: 50 },
                  acceptCount: { type: "integer", example: 600 },
                  residueCount: { type: "integer", example: 50 },
                },
              },
              productPackStats: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string", example: "Production" },
                    name: { type: "string", example: "Production" },
                    department: { type: "string", example: "Production" },
                    totalCount: { type: "integer", example: 300 },
                    protsessIsOver: { type: "boolean", example: false },
                    sendedCount: { type: "integer", example: 250 },
                    invalidCount: { type: "integer", example: 30 },
                    acceptCount: { type: "integer", example: 300 },
                    residueCount: { type: "integer", example: 20 },
                  },
                },
              },
              dateRange: {
                type: "object",
                properties: {
                  startDate: {
                    type: "string",
                    format: "date-time",
                    example: "2025-06-01T00:00:00.000Z",
                    nullable: true,
                  },
                  endDate: {
                    type: "string",
                    format: "date-time",
                    example: "2025-06-04T23:59:59.999Z",
                    nullable: true,
                  },
                },
              },
            },
          },
        },
      },
      ProductPackStatsResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            properties: {
              details: {
                type: "object",
                properties: {
                  number: { type: "integer", example: 1001 },
                  department: { type: "string", example: "Production" },
                  totalCount: { type: "integer", example: 50 },
                  protsessIsOver: { type: "boolean", example: false },
                  productGroup: {
                    type: "object",
                    properties: {
                      name: { type: "string", example: "A1" },
                      products: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            name: { type: "string", example: "Shirt" },
                            productSetting: {
                              type: "array",
                              items: {
                                type: "object",
                                properties: {
                                  totalCount: { type: "integer", example: 50 },
                                  sizeGroups: {
                                    type: "array",
                                    items: {
                                      type: "object",
                                      properties: {
                                        size: { type: "string", example: "M" },
                                        quantity: { type: "integer", example: 25 },
                                        colorSizes: {
                                          type: "array",
                                          items: {
                                            type: "object",
                                            properties: {
                                              quantity: { type: "integer", example: 25 },
                                              color: {
                                                type: "object",
                                                properties: {
                                                  name: { type: "string", example: "Blue" },
                                                },
                                              },
                                              size: {
                                                type: "object",
                                                properties: {
                                                  name: { type: "string", example: "Medium" },
                                                },
                                              },
                                            },
                                          },
                                        },
                                      },
                                    },
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                    },
                  },
                },
              stats: {
                type: "object",
                properties: {
                  sendedCount: { type: "integer", example: 40 },
                  invalidCount: { type: "integer", example: 5 },
                  residueCount: { type: "integer", example: 5 },
                  acceptCount: { type: "integer", example: 50 },
                },
              },
              processes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string", example: "process123" },
                    date: { type: "string", format: "date-time", example: "2025-06-01T09:00:00Z" },
                    status: { type: "string", example: "Yuborilgan" },
                    sendedCount: { type: "integer", example: 40 },
                    invalidCount: { type: "integer", example: 5 },
                    residueCount: { type: "integer", example: 5 },
                    acceptCount: { type: "integer", example: 50 },
                    invalidReason: { type: "string", example: "" },
                    department: {
                      type: "object",
                      properties: {
                        name: { type: "string", example: "Production" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      EmployeeStatsResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            properties: {
              employee: {
                type: "object",
                properties: {
                  id: { type: "string", example: "emp123" },
                  name: { type: "string", example: "John Doe" },
                  department: { type: "string", example: "Production" },
                },
              },
              totalProductCount: { type: "integer", example: 100 },
              productPackCount: { type: "integer", example: 2 },
              stats: {
                type: "object",
                properties: {
                  sendedCount: { type: "integer", example: 80 },
                  invalidCount: { type: "integer", example: 10 },
                  residueCount: { type: "integer", example: 10 },
                  acceptCount: { type: "integer", example: 100 },
                },
              },
              productPacks: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string", example: "invoice123" },
                    number: { type: "integer", example: 1001 },
                    totalCount: { type: "integer", example: 50 },
                    protsessIsOver: { type: "boolean", example: false },
                    department: { type: "string", example: "Production" },
                    productGroup: {
                      type: "object",
                      properties: {
                        name: { type: "string", example: "A1" },
                      },
                    },
                  },
                },
              },
              processes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string", example: "process123" },
                    date: { type: "string", format: "date-time", example: "2025-06-01T09:00:00Z" },
                    status: { type: "string", example: "Yuborilgan" },
                    sendedCount: { type: "integer", example: 40 },
                    invalidCount: { type: "integer", example: 5 },
                    residueCount: { type: "integer", example: 5 },
                    acceptCount: { type: "integer", example: 50 },
                    invalidReason: { type: "string", example: "" },
                    department: {
                      type: "object",
                      properties: {
                        name: { type: "string", example: "Production" },
                      },
                    },
                    invoice: {
                      type: "object",
                      properties: {
                        number: { type: "integer", example: 1001 },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      ModelCountsResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            properties: {
              basicCounts: {
                type: "object",
                properties: {
                  colors: { type: "integer", example: 10 },
                  sizes: { type: "integer", example: 5 },
                  departments: { type: "integer", example: 3 },
                  employees: { type: "integer", example: 20 },
                  users: { type: "integer", example: 25 },
                  invoices: { type: "integer", example: 100 },
                  products: { type: "integer", example: 50 },
                  processes: { type: "integer", example: 200 },
                },
              },
              detailedStats: {
                type: "object",
                properties: {
                  usersByRole: {
                    type: "object",
                    properties: {
                      ADMIN: { type: "integer", example: 5 },
                      USER: { type: "integer", example: 20 },
                    },
                  },
                  topColors: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string", example: "color1" },
                        name: { type: "string", example: "Blue" },
                        productColorSizeCount: { type: "integer", example: 30 },
                      },
                    },
                  },
                  topSizes: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string", example: "size1" },
                        name: { type: "string", example: "Medium" },
                        productColorSizeCount: { type: "integer", example: 25 },
                      },
                    },
                  },
                  departmentStats: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string", example: "dept1" },
                        name: { type: "string", example: "Production" },
                        employeeCount: { type: "integer", example: 10 },
                        processCount: { type: "integer", example: 100 },
                        completedProcesses: { type: "integer", example: 80 },
                        completionPercentage: { type: "integer", example: 80 },
                      },
                    },
                  },
                  topProductGroups: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        groupName: { type: "string", example: "A1" },
                        productCount: { type: "integer", example: 20 },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  paths: {
    ...authPaths.paths,
    ...colorPaths.paths,
    ...sizePaths.paths,
    ...dashboardPaths.paths, // Add dashboard paths
  },
};

const options = {
  swaggerDefinition,
  apis: [], // No additional JSDoc parsing needed since paths are defined manually
};

export const specs = swaggerJSDoc(options);
export const swaggerUi = swaggerUiExpress;
