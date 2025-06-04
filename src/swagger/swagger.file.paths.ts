const filePaths = {
  paths: {
    "/api/files/upload": {
      post: {
        tags: ["File"],
        summary: "Upload a single file",
        description: "Uploads a single file (image or document) with an optional product ID. Supports JPEG, PNG, GIF, WebP, PDF, Word, and Excel files up to 10MB.",
        operationId: "uploadFile",
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  file: {
                    type: "string",
                    format: "binary",
                    description: "File to upload (image or document)",
                  },
                  productId: {
                    type: "string",
                    example: "prod123",
                    description: "Optional ID of the associated product",
                    nullable: true,
                  },
                },
                required: ["file"],
              },
            },
          },
        },
        responses: {
          201: {
            description: "File uploaded successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/FileResponse" },
              },
            },
          },
          400: {
            description: "Bad request (no file uploaded or invalid file type)",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          404: {
            description: "Product not found (if productId provided)",
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
    "/api/files/upload/multiple": {
      post: {
        tags: ["File"],
        summary: "Upload multiple files",
        description: "Uploads up to 10 files (images or documents) with an optional product ID. Supports JPEG, PNG, GIF, WebP, PDF, Word, and Excel files up to 10MB each.",
        operationId: "uploadMultipleFiles",
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  files: {
                    type: "array",
                    items: {
                      type: "string",
                      format: "binary",
                    },
                    description: "Files to upload (images or documents)",
                  },
                  productId: {
                    type: "string",
                    example: "prod123",
                    description: "Optional ID of the associated product",
                    nullable: true,
                  },
                },
                required: ["files"],
              },
            },
          },
        },
        responses: {
          201: {
            description: "Files uploaded successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MultipleFilesResponse" },
              },
            },
          },
          400: {
            description: "Bad request (no files uploaded or invalid file types)",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          404: {
            description: "Product not found (if productId provided)",
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
    "/files": {
      get: {
        tags: ["File"],
        summary: "Get all files",
        description: "Retrieves a paginated list of files with optional filtering by file type and search by file name.",
        operationId: "getAllFiles",
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
            description: "Number of files per page",
            required: false,
            schema: { type: "integer", example: 10, minimum: 1 },
          },
          {
            name: "fileType",
            in: "query",
            description: "Filter by file type (IMAGE, DOCUMENT, OTHER, ALL)",
            required: false,
            schema: { type: "string", enum: ["IMAGE", "DOCUMENT", "OTHER", "ALL"], example: "IMAGE" },
          },
          {
            name: "search",
            in: "query",
            description: "Search by file name (case-insensitive)",
            required: false,
            schema: { type: "string", example: "invoice" },
          },
        ],
        responses: {
          200: {
            description: "Files retrieved successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/GetAllFilesResponse" },
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
    "/api/files/{id}": {
      get: {
        tags: ["File"],
        summary: "Get file by ID",
        description: "Retrieves details of a specific file by its ID.",
        operationId: "getFileById",
        parameters: [
          {
            name: "id",
            in: "path",
            description: "ID of the file",
            required: true,
            schema: { type: "string", example: "file123" },
          },
        ],
        responses: {
          200: {
            description: "File retrieved successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/FileDetailsResponse" },
              },
            },
          },
          404: {
            description: "File not found",
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
        tags: ["File"],
        summary: "Delete a file",
        description: "Deletes a file by its ID. Requires authentication.",
        operationId: "deleteFile",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            description: "ID of the file",
            required: true,
            schema: { type: "string", example: "file123" },
          },
        ],
        responses: {
          200: {
            description: "File deleted successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
              },
            },
          },
          404: {
            description: "File not found",
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
    "/api/files/{id}/download": {
      get: {
        tags: ["File"],
        summary: "Download a file",
        description: "Downloads a file by its ID, serving it inline for images or as an attachment for other types.",
        operationId: "downloadFile",
        parameters: [
          {
            name: "id",
            in: "path",
            description: "ID of the file",
            required: true,
            schema: { type: "string", example: "file123" },
          },
        ],
        responses: {
          200: {
            description: "File downloaded successfully",
            content: {
              "application/octet-stream": {
                schema: {
                  type: "string",
                  format: "binary",
                },
              },
            },
          },
          404: {
            description: "File not found",
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

export default filePaths;
