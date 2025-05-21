import multer from 'multer';
import path from 'path';
import { FileType } from '@prisma/client';

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads'); // Store files in the ./uploads directory
  },
  filename: (req, file, cb) => {
    // Use a unique filename with timestamp
    cb(null, `${Date.now()}${path.extname(file.originalname)}`);
  },
});

// Initialize multer
export const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Optional: Restrict file types (e.g., images only)
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // Optional: Limit file size to 5MB
});

// Helper function to map mimeType to FileType enum
export function determineFileType(mimeType: string): FileType {
  if (mimeType.startsWith('image/')) return FileType.IMAGE;
  if (mimeType.startsWith('application/')) return FileType.DOCUMENT;
  return FileType.OTHER;
}
