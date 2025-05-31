// swagger.auth.paths.ts
const authPaths = {
  paths: {
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'User login',
        description: 'Authenticates a user and returns access and refresh tokens',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Successful login',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    accessToken: { type: 'string', example: 'jwt-access-token' },
                    refreshToken: { type: 'string', example: 'jwt-refresh-token' },
                  },
                },
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
            description: 'Invalid credentials',
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
    '/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'User registration',
        description: 'Registers a new user with provided credentials and department',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'User registered successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', example: '1' },
                    login: { type: 'string', example: 'admin' },
                    role: { type: 'string', example: 'ADMIN' },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Missing required fields',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
            },
          },
          '409': {
            description: 'Login already taken',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
            },
          },
          '404': {
            description: 'Invalid departmentId',
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
    '/auth/refresh': {
      post: {
        tags: ['Authentication'],
        summary: 'Refresh access token',
        description: 'Generates a new access token using a refresh token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RefreshTokenRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Token refreshed successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    accessToken: { type: 'string', example: 'jwt-access-token' },
                    refreshToken: { type: 'string', example: 'jwt-refresh-token' },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Refresh token missing',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
            },
          },
          '403': {
            description: 'Invalid or expired refresh token',
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
    '/auth/logout': {
      post: {
        tags: ['Authentication'],
        summary: 'User logout',
        description: 'Invalidates the refresh token to log out the user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RefreshTokenRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Logged out successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Logged out successfully' },
                  },
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
    '/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Get current user',
        description: 'Retrieves information about the authenticated user',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'User information retrieved successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UserResponse' },
              },
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
    },
  },
};

// Merge with swaggerDefinition in swagger.config.ts
export default authPaths;
