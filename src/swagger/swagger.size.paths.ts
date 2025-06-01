// swagger.size.paths.ts
const sizePaths = {
  paths: {
    '/api/size': {
      post: {
        tags: ['Size'],
        summary: 'Create a new size',
        description: 'Creates a new size with the provided name',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SizeRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Size created successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Size' },
              },
            },
          },
          '400': {
            description: 'Missing required fields or size already exists',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
            },
          },
          '401': {
            description: 'User not authenticated',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
            },
          },
          '500': {
            description: 'Internal server error',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
            },
          },
        },
      },
      get: {
        tags: ['Size'],
        summary: 'Get all sizes',
        description: 'Retrieves a list of all sizes ordered by creation date',
        responses: {
          '200': {
            description: 'List of sizes retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Size' },
                },
              },
            },
          },
          '500': {
            description: 'Internal server error',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
            },
          },
        },
      },
    },
    '/api/size/{id}': {
      get: {
        tags: ['Size'],
        summary: 'Get a size by ID',
        description: 'Retrieves a size by its ID',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', example: '1' },
            description: 'ID of the size to retrieve',
          },
        ],
        responses: {
          '200': {
            description: 'Size retrieved successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Size' },
              },
            },
          },
          '404': {
            description: 'Size not found',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
            },
          },
          '500': {
            description: 'Internal server error',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
            },
          },
        },
      },
      patch: {
        tags: ['Size'],
        summary: 'Update a size',
        description: 'Updates an existing size by its ID (requires authentication)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', example: '1' },
            description: 'ID of the size to update',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SizeRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Size updated successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Size' },
              },
            },
          },
          '400': {
            description: 'Missing required fields',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
            },
          },
          '401': {
            description: 'User not authenticated',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
            },
          },
          '404': {
            description: 'Size not found',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
            },
          },
          '500': {
            description: 'Internal server error',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
            },
          },
        },
      },
      delete: {
        tags: ['Size'],
        summary: 'Delete a size',
        description: 'Deletes a size by its ID (requires authentication)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', example: '1' },
            description: 'ID of the size to delete',
          },
        ],
        responses: {
          '204': {
            description: 'Size deleted successfully',
          },
          '401': {
            description: 'User not authenticated',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
            },
          },
          '404': {
            description: 'Size not found',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
            },
          },
          '500': {
            description: 'Internal server error',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
            },
          },
        },
      },
    },
  },
};

export default sizePaths;
