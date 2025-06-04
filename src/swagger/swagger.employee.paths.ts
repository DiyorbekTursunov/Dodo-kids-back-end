const employeePaths = {
  paths: {
    "/api/employees": {
      post: {
        tags: ["Employee"],
        summary: "Create a new employee",
        description: "Creates a new employee with associated user account. Requires authentication.",
        operationId: "createEmployee",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateEmployeeRequest" },
            },
          },
        },
        responses: {
          201: {
            description: "Employee created successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateEmployeeResponse" },
              },
            },
          },
          400: {
            description: "Bad request (missing required fields)",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          409: {
            description: "Conflict (login already taken)",
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
        tags: ["Employee"],
        summary: "Get all employees",
        description: "Retrieves a paginated list of employees with optional filtering by department.",
        operationId: "getEmployees",
        parameters: [
          {
            name: "page",
            in: "query",
            description: "Page number for pagination",
            required: false,
            schema: { type: "integer", example: 1, minimum: 1 },
          },
          {
            name: "limit",
            in: "query",
            description: "Number of employees per page (max 100)",
            required: false,
            schema: { type: "integer", example: 10, minimum: 1, maximum: 100 },
          },
          {
            name: "departmentId",
            in: "query",
            description: "Filter employees by department ID",
            required: false,
            schema: { type: "string", example: "dept123" },
          },
        ],
        responses: {
          200: {
            description: "Employees retrieved successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/GetEmployeesResponse" },
              },
            },
          },
          400: {
            description: "Bad request (invalid pagination parameters)",
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
    "/api/employees/{id}": {
      get: {
        tags: ["Employee"],
        summary: "Get employee by ID",
        description: "Retrieves details of a specific employee by their ID.",
        operationId: "getEmployeeById",
        parameters: [
          {
            name: "id",
            in: "path",
            description: "ID of the employee",
            required: true,
            schema: { type: "string", example: "emp123" },
          },
        ],
        responses: {
          200: {
            description: "Employee retrieved successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/EmployeeResponse" },
              },
            },
          },
          400: {
            description: "Bad request (missing ID)",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
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
      put: {
        tags: ["Employee"],
        summary: "Update an employee",
        description: "Updates employee details by their ID. Requires authentication.",
        operationId: "updateEmployee",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            description: "ID of the employee",
            required: true,
            schema: { type: "string", example: "emp123" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateEmployeeRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Employee updated successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UpdateEmployeeResponse" },
              },
            },
          },
          400: {
            description: "Bad request (missing or invalid fields)",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          404: {
            description: "Employee or department not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          409: {
            description: "Conflict (login already taken)",
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
        tags: ["Employee"],
        summary: "Delete an employee",
        description: "Deletes an employee by their ID. Requires authentication.",
        operationId: "deleteEmployee",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            description: "ID of the employee",
            required: true,
            schema: { type: "string", example: "emp123" },
          },
        ],
        responses: {
          200: {
            description: "Employee deleted successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/DeleteEmployeeResponse" },
              },
            },
          },
          400: {
            description: "Bad request (missing ID)",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
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
    "/api/employees/department/{departmentId}": {
      get: {
        tags: ["Employee"],
        summary: "Get employees by department",
        description: "Retrieves a list of employees belonging to a specific department.",
        operationId: "getEmployeesByDepartment",
        parameters: [
          {
            name: "departmentId",
            in: "path",
            description: "ID of the department",
            required: true,
            schema: { type: "string", example: "dept123" },
          },
        ],
        responses: {
          200: {
            description: "Employees retrieved successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/api/EmployeesByDepartmentResponse" },
              },
            },
          },
          400: {
            description: "Bad request (missing department ID)",
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

export default employeePaths;
