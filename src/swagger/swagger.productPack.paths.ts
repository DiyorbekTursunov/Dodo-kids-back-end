const productPackPaths = {
  '/add-warehouse': {
    post: {
      summary: 'Create a new invoice in the Bichuv department',
      description: 'Creates a new invoice for the Bichuv department with the provided details.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreateInvoiceRequest' },
          },
        },
      },
      responses: {
        '201': {
          description: 'Invoice created successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/InvoiceResponse' },
                  },
                  meta: {
                    type: 'object',
                    properties: {
                      total: { type: 'integer' },
                      page: { type: 'integer' },
                      limit: { type: 'integer' },
                      totalPages: { type: 'integer' },
                    },
                  },
                },
              },
            },
          },
        },
        '400': {
          description: 'Bad request',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        '500': {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },
    },
  },
  '/product_pack/get-all-warehouse': {
    get: {
      summary: 'Get all product packs for acceptance to department',
      description: 'Retrieves a paginated list of product packs with optional filtering by status and department.',
      parameters: [
        {
          in: 'query',
          name: 'page',
          schema: { type: 'integer', default: 1 },
        },
        {
          in: 'query',
          name: 'limit',
          schema: { type: 'integer', default: 10 },
        },
        {
          in: 'query',
          name: 'status',
          schema: { type: 'string' },
        },
        {
          in: 'query',
          name: 'departmentId',
          schema: { type: 'string' },
        },
      ],
      responses: {
        '200': {
          description: 'Successfully retrieved product packs',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/InvoiceResponse' },
                  },
                  meta: {
                    type: 'object',
                    properties: {
                      total: { type: 'integer' },
                      page: { type: 'integer' },
                      limit: { type: 'integer' },
                      totalPages: { type: 'integer' },
                    },
                  },
                },
              },
            },
          },
        },
        '500': {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },
    },
  },
  '/send-to-department': {
    post: {
      summary: 'Send products to another department',
      description: 'Sends specified products from one department to another, updating their status accordingly.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/SendProductRequest' },
          },
        },
      },
      responses: {
        '200': {
          description: 'Products sent successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/InvoiceResponse' },
                  },
                  meta: {
                    type: 'object',
                    properties: {
                      total: { type: 'integer' },
                      page: { type: 'integer' },
                      limit: { type: 'integer' },
                      totalPages: { type: 'integer' },
                    },
                  },
                },
              },
            },
          },
        },
        '400': {
          description: 'Bad request',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        '404': {
          description: 'Not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        '500': {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },
    },
    get: {
      summary: 'Get sent product packs by department',
      description: 'Retrieves a paginated list of sent product packs for a specific department.',
      parameters: [
        {
          in: 'query',
          name: 'departmentId',
          required: true,
          schema: { type: 'string' },
        },
        {
          in: 'query',
          name: 'page',
          schema: { type: 'integer', default: 1 },
        },
        {
          in: 'query',
          name: 'pageSize',
          schema: { type: 'integer', default: 10 },
        },
      ],
      responses: {
        '200': {
          description: 'Successfully retrieved sent product packs',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string' },
                  data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/InvoiceResponse' },
                  },
                  pagination: {
                    type: 'object',
                    properties: {
                      currentPage: { type: 'integer' },
                      pageSize: { type: 'integer' },
                      totalCount: { type: 'integer' },
                      totalPages: { type: 'integer' },
                    },
                  },
                },
              },
            },
          },
        },
        '400': {
          description: 'Bad request',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        '404': {
          description: 'Not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        '500': {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },
    },
  },
  '/product_pack/acceptance-to-department': {
    post: {
      summary: 'Accept a product pack',
      description: 'Accepts the specified product pack, updating its status and related records.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/AcceptProductPackRequest' },
          },
        },
      },
      responses: {
        '200': {
          description: 'Product pack accepted successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string' },
                  deletedPendingStatus: { type: 'string' },
                  newStatus: { $ref: '#/components/schemas/StatusResponse' },
                  processRecords: {
                    type: 'array',
                    items: { type: 'object' },
                  },
                  isComplete: { type: 'boolean' },
                },
              },
            },
          },
        },
        '400': {
          description: 'Bad request',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        '404': {
          description: 'Not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        '500': {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },
    },
    get: {
      summary: 'Get accepted product packs',
      description: 'Retrieves a paginated list of accepted product packs for a specific department.',
      parameters: [
        {
          in: 'query',
          name: 'departmentId',
          required: true,
          schema: { type: 'string' },
        },
        {
          in: 'query',
          name: 'page',
          schema: { type: 'integer', default: 1 },
        },
        {
          in: 'query',
          name: 'pageSize',
          schema: { type: 'integer', default: 10 },
        },
      ],
      responses: {
        '200': {
          description: 'Successfully retrieved accepted product packs',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string' },
                  data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/InvoiceResponse' },
                  },
                  pagination: {
                    type: 'object',
                    properties: {
                      currentPage: { type: 'integer' },
                      pageSize: { type: 'integer' },
                      totalCount: { type: 'integer' },
                      totalPages: { type: 'integer' },
                    },
                  },
                },
              },
            },
          },
        },
        '400': {
          description: 'Bad request',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        '404': {
          description: 'Not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        '500': {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },
    },
  },
};

export default productPackPaths;
