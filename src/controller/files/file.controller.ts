// controller/fileController.ts
import { Request, Response } from "express";
import { PrismaClient, FileType } from "@prisma/client";
import multer from "multer";
import path from "path";
import fs from "fs";

const prisma = new PrismaClient();

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Use uploads directory in project root
    const uploadDir = path.join(process.cwd(), 'uploads');

    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    console.log('Upload directory:', uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Create unique filename with original extension
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

// File filter function
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Define allowed file types
  const allowedImageTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp"
  ];

  const allowedDocumentTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ];

  if (allowedImageTypes.includes(file.mimetype) || allowedDocumentTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only images and documents are allowed."));
  }
};

// Configure multer upload
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB file size limit
  },
});

// Determine file type based on mimetype
const getFileType = (mimeType: string): FileType => {
  if (mimeType.startsWith("image/")) {
    return FileType.IMAGE;
  } else if (
    mimeType === "application/pdf" ||
    mimeType === "application/msword" ||
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/vnd.ms-excel" ||
    mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ) {
    return FileType.DOCUMENT;
  } else {
    return FileType.OTHER;
  }
};

// Helper function to generate file URL
const generateFileUrl = (req: Request, fileId: string): string => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}/api/files/${fileId}/download`;
};

// Helper function to generate static file URL
const generateStaticFileUrl = (req: Request, fileName: string): string => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}/uploads/${fileName}`;
};

// Controller methods
export const uploadFile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: "No file uploaded" });
      return;
    }

    const { productId } = req.body;

    console.log('File uploaded:', {
      originalName: req.file.originalname,
      path: req.file.path,
      filename: req.file.filename,
      exists: fs.existsSync(req.file.path)
    });

    // If productId is provided, verify that the product exists
    if (productId) {
      const product = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        res.status(404).json({ message: "Product not found" });
        return;
      }
    }

    const file = await prisma.file.create({
      data: {
        fileName: req.file.originalname,
        path: req.file.path,
        mimeType: req.file.mimetype,
        size: req.file.size,
        fileType: getFileType(req.file.mimetype),
      },
    });

    // Add URLs to the response
    const fileWithUrls = {
      ...file,
      url: generateFileUrl(req, file.id),
      staticUrl: generateStaticFileUrl(req, req.file.filename) // Use the generated filename
    };

    res.status(201).json({
      message: "File uploaded successfully",
      file: fileWithUrls,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: (error as Error).message,
    });
  }
};

export const uploadMultipleFiles = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
      res.status(400).json({ message: "No files uploaded" });
      return;
    }

    const { productId } = req.body;

    // If productId is provided, verify that the product exists
    if (productId) {
      const product = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        res.status(404).json({ message: "Product not found" });
        return;
      }
    }

    const files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();

    const uploadedFiles = await Promise.all(
      files.map(async (file) => {
        return prisma.file.create({
          data: {
            fileName: file.originalname,
            path: file.path,
            mimeType: file.mimetype,
            size: file.size,
            fileType: getFileType(file.mimetype),
          },
        });
      })
    );

    // Add URLs to the response
    const filesWithUrls = uploadedFiles.map((file, index) => ({
      ...file,
      url: generateFileUrl(req, file.id),
      staticUrl: generateStaticFileUrl(req, files[index].filename)
    }));

    res.status(201).json({
      message: "Files uploaded successfully",
      files: filesWithUrls,
    });
  } catch (error) {
    console.error("Error uploading files:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: (error as Error).message,
    });
  }
};

// Get all files
export const getAllFiles = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '10',
      fileType,
      search
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};

    if (fileType && fileType !== 'ALL') {
      where.fileType = fileType as FileType;
    }

    if (search) {
      where.fileName = {
        contains: search as string,
        mode: 'insensitive'
      };
    }

    // Get files with pagination
    const [files, totalCount] = await Promise.all([
      prisma.file.findMany({
        where,
        skip: offset,
        take: limitNum,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.file.count({ where })
    ]);

    // Add URLs to files
    const filesWithUrls = files.map(file => ({
      ...file,
      url: generateFileUrl(req, file.id),
      staticUrl: generateStaticFileUrl(req, path.basename(file.path))
    }));

    const totalPages = Math.ceil(totalCount / limitNum);

    res.status(200).json({
      files: filesWithUrls,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    });
  } catch (error) {
    console.error("Error fetching files:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: (error as Error).message,
    });
  }
};

export const getFileById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const file = await prisma.file.findUnique({
      where: { id },
    });

    if (!file) {
      res.status(404).json({ message: "File not found" });
      return;
    }

    // Add URLs to the response
    const fileWithUrls = {
      ...file,
      url: generateFileUrl(req, file.id),
      staticUrl: generateStaticFileUrl(req, path.basename(file.path))
    };

    res.status(200).json(fileWithUrls);
  } catch (error) {
    console.error("Error fetching file:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: (error as Error).message,
    });
  }
};

// Serve/download file
export const downloadFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const file = await prisma.file.findUnique({
      where: { id },
    });

    if (!file) {
      res.status(404).json({ message: "File not found" });
      return;
    }

    console.log('Attempting to serve file:', {
      id: file.id,
      path: file.path,
      exists: fs.existsSync(file.path)
    });

    // Check if file exists on filesystem
    if (!fs.existsSync(file.path)) {
      console.error('File not found on filesystem:', file.path);
      res.status(404).json({
        message: "File not found on server",
        filePath: file.path,
        currentDir: process.cwd(),
        uploadDir: path.join(process.cwd(), 'uploads')
      });
      return;
    }

    // Set appropriate headers
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Length', file.size);

    // For images, we want to display them inline
    if (file.fileType === FileType.IMAGE) {
      res.setHeader('Content-Disposition', `inline; filename="${file.fileName}"`);
    } else {
      // For documents, trigger download
      res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
    }

    // Stream the file
    const fileStream = fs.createReadStream(file.path);
    fileStream.pipe(res);
  } catch (error) {
    console.error("Error downloading file:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: (error as Error).message,
    });
  }
};

export const deleteFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const file = await prisma.file.findUnique({
      where: { id },
    });

    if (!file) {
      res.status(404).json({ message: "File not found" });
      return;
    }

    // Delete the file from the filesystem
    fs.unlink(file.path, async (err) => {
      if (err) {
        console.error("Error deleting file from filesystem:", err);
      }

      // Delete the file record from the database
      await prisma.file.delete({
        where: { id },
      });

      res.status(200).json({ message: "File deleted successfully" });
    });
  } catch (error) {
    console.error("Error deleting file:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: (error as Error).message,
    });
  }
};
