import 'express';
import { FileType } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        login: string;
        role: string;
      };
    }
  }
}
