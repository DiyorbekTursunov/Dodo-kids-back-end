const filterPaths = {
  paths: {
    "/filter": {
      get: {
        tags: ["Filter"],
        summary: "Get filtered product packs",
        description: "Retrieves a paginated list of product packs filtered by various criteria such as date range, department, logical ID, status, color, size, outsourcing status, and search term, with sorting options.",
        operationId: "getFilteredProductPacks",
        parameters: [
          {
            name: "startDate",
            in: "query",
            description: "Start date for filtering by creation date (YYYY-MM-DD)",
            required: false,
            schema: { type: "string", format: "date", example: "2025-06-01" },
          },
          {
            name: "endDate",
            in: "query",
            description: "End date for filtering by creation date (YYYY-MM-DD)",
            required: false,
            schema: { type: "string", format: "date", example: "2025-06-04" },
          },
          {
            name: "searchName",
            in: "query",
            description: "Search term for product pack number or product group name (case-insensitive)",
            required: false,
            schema: { type: "string", example: "Shirt" },
          },
          {
            name: "departmentId",
            in: "query",
            description: "ID of the department to filter by",
            required: false,
            schema: { type: "string", example: "dept123" },
          },
          {
            name: "logicalId",
            in: "query",
            description: "Logical ID of the department in the workflow (1-10)",
            required: false,
            schema: { type: "integer", example: 3, minimum: 1, maximum: 10 },
          },
          {
            name: "status",
            in: "query",
            description: "Status of the product pack (e.g., Pending, Yuborilgan)",
            required: false,
            schema: { type: "string", example: "Yuborilgan" },
          },
          {
            name: "includePending",
            in: "query",
            description: "Include product packs with Pending status (default: true)",
            required: false,
            schema: { type: "boolean", example: true },
          },
          {
            name: "colorId",
            in: "query",
            description: "ID of the color to filter by",
            required: false,
            schema: { type: "string", example: "color123" },
          },
          {
            name: "sizeId",
            in: "query",
            description: "ID of the size to filter by",
            required: false,
            schema: { type: "string", example: "size123" },
          },
          {
            name: "isOutsourseCompany",
            in: "query",
            description: "Filter by outsourcing status",
            required: false,
            schema: { type: "boolean", example: true },
          },
          {
            name: "sortBy",
            in: "query",
            description: "Field to sort by",
            required: false,
            schema: { type: "string", enum: ["createdAt", "totalCount"], example: "createdAt" },
          },
          {
            name: "sortOrder",
            in: "query",
            description: "Sort order",
            required: false,
            schema: { type: "string", enum: ["asc", "desc"], example: "desc" },
          },
          {
            name: "page",
            in: "query",
            description: "Page number for pagination",
            required: false,
            schema: { type: "integer", example: 1, minimum: 1 },
          },
          {
            name: "pageSize",
            in: "query",
            description: "Number of items per page",
            required: false,
            schema: { type: "integer", example: 10, minimum: 1 },
          },
        ],
        responses: {
          200: {
            description: "Product packs retrieved successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/FilteredProductPacksResponse" },
              },
            },
          },
          400: {
            description: "Bad request (invalid query parameters)",
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

export default filterPaths;
