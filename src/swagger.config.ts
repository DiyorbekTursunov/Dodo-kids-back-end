import swaggerJSDoc from "swagger-jsdoc";
import swaggerUiExpress from "swagger-ui-express";
import authPaths from "./swagger/swagger.auth.paths";
import colorPaths from "./swagger/swagger.colors.paths";
import sizePaths from "./swagger/swagger.size.paths";
import dashboardPaths from "./swagger/swagger.dashboard.paths";
import employeePaths from "./swagger/swagger.employee.paths";
import filePaths from "./swagger/swagger.file.paths";
import departmentPaths from "./swagger/swagger.department.paths";
import filterPaths from "./swagger/swagger.filter.paths";
import productPackPaths from "./swagger/swagger.productPack.paths";

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
      // Existing schemas (auth, color, size)
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
          message: {
            type: "string",
            example: "Operation completed successfully",
          },
        },
      },
      // Existing dashboard schemas
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
                                        quantity: {
                                          type: "integer",
                                          example: 25,
                                        },
                                        colorSizes: {
                                          type: "array",
                                          items: {
                                            type: "object",
                                            properties: {
                                              quantity: {
                                                type: "integer",
                                                example: 25,
                                              },
                                              color: {
                                                type: "object",
                                                properties: {
                                                  name: {
                                                    type: "string",
                                                    example: "Blue",
                                                  },
                                                },
                                              },
                                              size: {
                                                type: "object",
                                                properties: {
                                                  name: {
                                                    type: "string",
                                                    example: "Medium",
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
                    date: {
                      type: "string",
                      format: "date-time",
                      example: "2025-06-01T09:00:00Z",
                    },
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
                    date: {
                      type: "string",
                      format: "date-time",
                      example: "2025-06-01T09:00:00Z",
                    },
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
      // Existing employee schemas
      CreateEmployeeRequest: {
        type: "object",
        required: ["login", "password", "role", "departmentId"],
        properties: {
          login: { type: "string", example: "john.doe" },
          password: { type: "string", example: "password123" },
          role: { type: "string", enum: ["ADMIN", "USER"], example: "USER" },
          departmentId: { type: "string", example: "dept123" },
          name: { type: "string", example: "John Doe", nullable: true },
        },
      },
      CreateEmployeeResponse: {
        type: "object",
        properties: {
          message: {
            type: "string",
            example: "Employee registered successfully",
          },
          token: { type: "string", example: "jwt-token" },
          user: { $ref: "#/components/schemas/EmployeeResponse" },
        },
      },
      UpdateEmployeeRequest: {
        type: "object",
        properties: {
          login: {
            type: "string",
            example: "john.doe.updated",
            nullable: true,
          },
          password: {
            type: "string",
            example: "newpassword123",
            nullable: true,
          },
          role: {
            type: "string",
            enum: ["ADMIN", "USER"],
            example: "ADMIN",
            nullable: true,
          },
          departmentId: { type: "string", example: "dept456", nullable: true },
          name: { type: "string", example: "John Doe Updated", nullable: true },
        },
      },
      UpdateEmployeeResponse: {
        type: "object",
        properties: {
          message: { type: "string", example: "Employee updated successfully" },
          user: { $ref: "#/components/schemas/EmployeeResponse" },
        },
      },
      DeleteEmployeeResponse: {
        type: "object",
        properties: {
          message: { type: "string", example: "Employee deleted successfully" },
          deletedEmployee: {
            type: "object",
            properties: {
              id: { type: "string", example: "emp123" },
              login: { type: "string", example: "john.doe" },
              employeeName: { type: "string", example: "John Doe" },
            },
          },
        },
      },
      EmployeeResponse: {
        type: "object",
        properties: {
          id: { type: "string", example: "emp123" },
          login: { type: "string", example: "john.doe" },
          role: { type: "string", example: "USER" },
          createdAt: {
            type: "string",
            format: "date-time",
            example: "2025-06-01T10:00:00Z",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            example: "2025-06-01T10:00:00Z",
          },
          employee: {
            type: "object",
            properties: {
              id: { type: "string", example: "emp123" },
              name: { type: "string", example: "John Doe" },
              departmentId: { type: "string", example: "dept123" },
              createdAt: {
                type: "string",
                format: "date-time",
                example: "2025-06-01T10:00:00Z",
              },
              updatedAt: {
                type: "string",
                format: "date-time",
                example: "2025-06-01T10:00:00Z",
              },
              department: {
                type: "object",
                properties: {
                  id: { type: "string", example: "dept123" },
                  name: { type: "string", example: "Production" },
                },
              },
            },
          },
        },
      },
      GetEmployeesResponse: {
        type: "object",
        properties: {
          employees: {
            type: "array",
            items: { $ref: "#/components/schemas/EmployeeResponse" },
          },
          pagination: {
            type: "object",
            properties: {
              currentPage: { type: "integer", example: 1 },
              totalPages: { type: "integer", example: 5 },
              totalItems: { type: "integer", example: 50 },
              itemsPerPage: { type: "integer", example: 10 },
            },
          },
        },
      },
      EmployeesByDepartmentResponse: {
        type: "object",
        properties: {
          department: {
            type: "object",
            properties: {
              id: { type: "string", example: "dept123" },
              name: { type: "string", example: "Production" },
            },
          },
          employees: {
            type: "array",
            items: { $ref: "#/components/schemas/EmployeeResponse" },
          },
          count: { type: "integer", example: 10 },
        },
      },
      // Existing file schemas
      FileResponse: {
        type: "object",
        properties: {
          message: { type: "string", example: "File uploaded successfully" },
          file: { $ref: "#/components/schemas/FileDetailsResponse" },
        },
      },
      MultipleFilesResponse: {
        type: "object",
        properties: {
          message: { type: "string", example: "Files uploaded successfully" },
          files: {
            type: "array",
            items: { $ref: "#/components/schemas/FileDetailsResponse" },
          },
        },
      },
      FileDetailsResponse: {
        type: "object",
        properties: {
          id: { type: "string", example: "file123" },
          fileName: { type: "string", example: "invoice.pdf" },
          path: {
            type: "string",
            example: "http://localhost:3000/Uploads/file-1234567890.pdf",
          },
          mimeType: { type: "string", example: "application/pdf" },
          size: { type: "integer", example: 1024000 },
          fileType: {
            type: "string",
            enum: ["IMAGE", "DOCUMENT", "OTHER"],
            example: "DOCUMENT",
          },
          createdAt: {
            type: "string",
            format: "date-time",
            example: "2025-06-01T10:00:00Z",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            example: "2025-06-01T10:00:00Z",
          },
          url: {
            type: "string",
            example: "http://localhost:3000/api/files/file123/download",
          },
          staticUrl: {
            type: "string",
            example: "http://localhost:3000/Uploads/file-1234567890.pdf",
          },
        },
      },
      GetAllFilesResponse: {
        type: "object",
        properties: {
          files: {
            type: "array",
            items: { $ref: "#/components/schemas/FileDetailsResponse" },
          },
          pagination: {
            type: "object",
            properties: {
              currentPage: { type: "integer", example: 1 },
              totalPages: { type: "integer", example: 5 },
              totalCount: { type: "integer", example: 50 },
              hasNextPage: { type: "boolean", example: true },
              hasPrevPage: { type: "boolean", example: false },
            },
          },
        },
      },
      // Existing department schemas
      CreateDepartmentRequest: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string", example: "Production" },
        },
      },
      UpdateDepartmentRequest: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string", example: "Production Updated" },
        },
      },
      DepartmentResponse: {
        type: "object",
        properties: {
          message: {
            type: "string",
            example: "Department created successfully",
          },
          data: { $ref: "#/components/schemas/DepartmentDetailsResponse" },
        },
      },
      DeleteDepartmentResponse: {
        type: "object",
        properties: {
          message: {
            type: "string",
            example: "Department deleted successfully",
          },
          data: { $ref: "#/components/schemas/DepartmentDetailsResponse" },
        },
      },
      DepartmentDetailsResponse: {
        type: "object",
        properties: {
          id: { type: "string", example: "dept123" },
          name: { type: "string", example: "Production" },
          createdAt: {
            type: "string",
            format: "date-time",
            example: "2025-06-01T10:00:00Z",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            example: "2025-06-01T10:00:00Z",
          },
        },
      },
      GetDepartmentsResponse: {
        type: "object",
        properties: {
          departments: {
            type: "array",
            items: { $ref: "#/components/schemas/DepartmentDetailsResponse" },
          },
        },
      },
      GetNextDepartmentsResponse: {
        type: "object",
        properties: {
          nextDepartments: {
            type: "array",
            items: { $ref: "#/components/schemas/DepartmentDetailsResponse" },
          },
        },
      },
      // New filter schemas
      ConsolidatedProductPack: {
        type: "object",
        properties: {
          id: { type: "string", example: "pack123" },
          department: { type: "string", example: "pechat" },
          logicalId: { type: "integer", example: 3 },
          protsessIsOver: { type: "boolean", example: false },
          perentId: { type: "string", example: "parent123" },
          ProductGroup: {
            type: "object",
            properties: {
              id: { type: "string", example: "group123" },
              name: { type: "string", example: "A1" },
              colors: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string", example: "color123" },
                    name: { type: "string", example: "Blue" },
                  },
                },
              },
              sizes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string", example: "size123" },
                    name: { type: "string", example: "Medium" },
                  },
                },
              },
            },
          },
          totalCount: { type: "integer", example: 100 },
          sendedCount: { type: "integer", example: 80 },
          acceptCount: { type: "integer", example: 70 },
          residueCount: { type: "integer", example: 10 },
          isSent: { type: "boolean", example: true },
          status: { type: "string", example: "Yuborilgan" },
          isOutsourseCompany: { type: "boolean", example: false },
          outsourseCompanyId: { type: "string", example: null, nullable: true },
          outsourseName: { type: "string", example: null, nullable: true },
        },
      },
      GroupedProductPack: {
        type: "object",
        properties: {
          perentId: { type: "string", example: "parent123" },
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/ConsolidatedProductPack" },
          },
        },
      },
      FilteredProductPacksResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          count: { type: "integer", example: 2 },
          totalCount: { type: "integer", example: 50 },
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/GroupedProductPack" },
          },
          pagination: {
            type: "object",
            properties: {
              currentPage: { type: "integer", example: 1 },
              pageSize: { type: "integer", example: 10 },
              totalPages: { type: "integer", example: 5 },
              hasNextPage: { type: "boolean", example: true },
              hasPrevPage: { type: "boolean", example: false },
              totalItems: { type: "integer", example: 50 },
            },
          },
          filters: {
            type: "object",
            properties: {
              applied: {
                type: "object",
                properties: {
                  startDate: {
                    type: "string",
                    example: "2025-06-01",
                    nullable: true,
                  },
                  endDate: {
                    type: "string",
                    example: "2025-06-04",
                    nullable: true,
                  },
                  searchName: {
                    type: "string",
                    example: "Shirt",
                    nullable: true,
                  },
                  departmentId: {
                    type: "string",
                    example: "dept123",
                    nullable: true,
                  },
                  logicalId: { type: "integer", example: 3, nullable: true },
                  status: {
                    type: "string",
                    example: "Yuborilgan",
                    nullable: true,
                  },
                  includePending: { type: "boolean", example: true },
                  colorId: {
                    type: "string",
                    example: "color123",
                    nullable: true,
                  },
                  sizeId: {
                    type: "string",
                    example: "size123",
                    nullable: true,
                  },
                  isOutsourseCompany: {
                    type: "boolean",
                    example: false,
                    nullable: true,
                  },
                  sortBy: { type: "string", example: "createdAt" },
                  sortOrder: { type: "string", example: "desc" },
                  page: { type: "integer", example: 1 },
                  pageSize: { type: "integer", example: 10 },
                },
              },
              resultsAfterFiltering: { type: "integer", example: 50 },
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
    ...departmentPaths.paths,
    ...employeePaths.paths,
    ...filePaths.paths,
    ...filterPaths.paths,
    ...dashboardPaths.paths,
    ...productPackPaths,
  },
};

const options = {
  swaggerDefinition,
  apis: [], // No additional JSDoc parsing needed since paths are defined manually
};

export const specs = swaggerJSDoc(options);
export const swaggerUi = swaggerUiExpress;
