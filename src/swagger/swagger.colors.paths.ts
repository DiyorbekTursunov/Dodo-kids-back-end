// swagger.colors.paths.ts (fixed)
const colorPaths = {
  paths: {
    '/api/color': {
      post: {
        tags: ['Color'],
        summary: 'Create a new color',
        description: 'Creates a new color with the provided name',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ColorRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Color created successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Color' },
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
          '500': {
            description: 'Internal server error',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
            },
          },
        },
      },
      get: {
        tags: ['Color'],
        summary: 'Get all colors',
        description: 'Retrieves a list of all colors',
        responses: {
          '200': {
            description: 'List of colors retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Color' },
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
    '/api/color/{id}': {
      get: {
        tags: ['Color'],
        summary: 'Get a color by ID',
        description: 'Retrieves a color by its ID',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', example: '1' },
            description: 'ID of the color to retrieve',
          },
        ],
        responses: {
          '200': {
            description: 'Color retrieved successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Color' },
              },
            },
          },
          '404': {
            description: 'Color not found',
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
        tags: ['Color'],
        summary: 'Update a color',
        description: 'Updates an existing color by its ID (requires authentication)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', example: '1' },
            description: 'ID of the color to update',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ColorRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Color updated successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Color' },
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
            description: 'Color not found',
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
        tags: ['Color'],
        summary: 'Delete a color',
        description: 'Deletes a color by its ID (requires authentication)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', example: '1' },
            description: 'ID of the color to delete',
          },
        ],
        responses: {
          '204': {
            description: 'Color deleted successfully',
          },
          '401': {
            description: 'User not authenticated',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
            },
          },
          '404': {
            description: 'Color not found',
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

export default colorPaths;
