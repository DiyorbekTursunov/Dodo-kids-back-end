const dashboardPaths = {
  paths: {
    "/api/dashboard": {
      get: {
        tags: ["Dashboard"],
        summary: "Get dashboard statistics by date range",
        description: "Retrieves aggregated statistics for invoices and processes within a specified date range.",
        operationId: "getDashboardStatsByDateRange",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "startDate",
            in: "query",
            description: "Start date for filtering (ISO 8601 format)",
            required: false,
            schema: { type: "string", format: "date", example: "2025-06-01" },
          },
          {
            name: "endDate",
            in: "query",
            description: "End date for filtering (ISO 8601 format)",
            required: false,
            schema: { type: "string", format: "date", example: "2025-06-04" },
          },
        ],
        responses: {
          200: {
            description: "Dashboard statistics retrieved successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schema/apis/DashboardStatsResponse" },
              },
            },
          },
          400: {
            description: "Bad request",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          500: {
            description: "Internal server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
      post: {
        tags: ["Dashboard"],
        summary: "Get dashboard statistics by date range (POST)",
        description: "Retrieves aggregated statistics for invoices and processes within a specified date range using request body.",
        operationId: "getDashboardStatsByDateRangePost",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/DateRangeRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Dashboard statistics retrieved successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/DashboardStatsResponse" },
              },
            },
          },
          400: {
            description: "Bad request",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          500: {
            description: "Internal server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/product-pack/{id}": {
      get: {
        tags: ["Dashboard"],
        summary: "Get statistics for a specific invoice",
        description: "Retrieves detailed statistics for an invoice (product pack) by its ID.",
        operationId: "getProductPackStats",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            description: "ID of the invoice",
            required: true,
            schema: { type: "string", example: "invoice123" },
          },
        ],
        responses: {
          200: {
            description: "Invoice statistics retrieved successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ProductPackStatsResponse" },
              },
            },
          },
          404: {
            description: "Invoice not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          500: {
            description: "Internal server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/employee/{employeeId}": {
      get: {
        tags: ["Dashboard"],
        summary: "Get statistics for a specific employee",
        description: "Retrieves detailed statistics for an employee by their ID.",
        operationId: "getEmployeeStats",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "employeeId",
            in: "path",
            description: "ID of the employee",
            required: true,
            schema: { type: "string", example: "emp123" },
          },
        ],
        responses: {
          200: {
            description: "Employee statistics retrieved successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/EmployeeStatsResponse" },
              },
            },
          },
          404: {
            description: "Employee not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          500: {
            description: "Internal server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/model-counts": {
      get: {
        tags: ["Dashboard"],
        summary: "Get counts for all models",
        description: "Retrieves counts and detailed statistics for all models in the database.",
        operationId: "getAllModelCounts",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Model counts retrieved successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ModelCountsResponse" },
              },
            },
          },
          500: {
            description: "Internal server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
  },
};

export default dashboardPaths;
