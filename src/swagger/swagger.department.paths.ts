const departmentPaths = {
  paths: {
    "/api/departments": {
      post: {
        tags: ["Department"],
        summary: "Create a new department",
        description: "Creates a new department with the provided name.",
        operationId: "createDepartment",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateDepartmentRequest" },
            },
          },
        },
        responses: {
          201: {
            description: "Department created successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/DepartmentResponse" },
              },
            },
          },
          400: {
            description: "Bad request (missing name)",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          409: {
            description: "Conflict (department name already exists)",
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
      get: {
        tags: ["Department"],
        summary: "Get all departments",
        description: "Retrieves a list of all departments, ordered by creation date (descending).",
        operationId: "getDepartments",
        responses: {
          200: {
            description: "Departments retrieved successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/GetDepartmentsResponse" },
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
    "/api/departments/{id}": {
      get: {
        tags: ["Department"],
        summary: "Get department by ID",
        description: "Retrieves details of a specific department by its ID.",
        operationId: "getDepartmentById",
        parameters: [
          {
            name: "id",
            in: "path",
            description: "ID of the department",
            required: true,
            schema: { type: "string", example: "dept123" },
          },
        ],
        responses: {
          200: {
            description: "Department retrieved successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/DepartmentDetailsResponse" },
              },
            },
          },
          404: {
            description: "Department not found",
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
      put: {
        tags: ["Department"],
        summary: "Update a department",
        description: "Updates a department's name by its ID. Requires authentication.",
        operationId: "updateDepartment",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            description: "ID of the department",
            required: true,
            schema: { type: "string", example: "dept123" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateDepartmentRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Department updated successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/DepartmentDetailsResponse" },
              },
            },
          },
          400: {
            description: "Bad request (missing name)",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          404: {
            description: "Department not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          409: {
            description: "Conflict (department name already exists)",
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
      delete: {
        tags: ["Department"],
        summary: "Delete a department",
        description: "Deletes a department by its ID. Requires authentication.",
        operationId: "deleteDepartment",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            description: "ID of the department",
            required: true,
            schema: { type: "string", example: "dept123" },
          },
        ],
        responses: {
          200: {
            description: "Department deleted successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/DeleteDepartmentResponse" },
              },
            },
          },
          404: {
            description: "Department not found",
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
    "/api/departments/next/{departmentId}": {
      get: {
        tags: ["Department"],
        summary: "Get next departments in flow",
        description: "Retrieves the next departments in the workflow for a given department ID.",
        operationId: "getNextDepartments",
        parameters: [
          {
            name: "departmentId",
            in: "path",
            description: "ID of the current department",
            required: true,
            schema: { type: "string", example: "dept123" },
          },
        ],
        responses: {
          200: {
            description: "Next departments retrieved successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/GetNextDepartmentsResponse" },
              },
            },
          },
          404: {
            description: "Department not found",
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
  },
};

export default departmentPaths;
