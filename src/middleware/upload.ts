import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import { Request } from 'express';

/**
 * Storage configuration for uploaded images
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Store in uploads folder
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-randomstring-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    cb(null, `${nameWithoutExt}-${uniqueSuffix}${ext}`);
  },
});

/**
 * File filter - only allow images
 */
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  // Allowed extensions
  const allowedExtensions = /jpeg|jpg|png|gif|webpheif|heic/;
  const extname = allowedExtensions.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedExtensions.test(file.mimetype);

  if (mimetype && extname) {
    cb(null, true); // Accept file
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

/**
 * Multer upload configuration
 */
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB default
  },
  fileFilter: fileFilter,
});

/**
 * Multiple images upload (max 10 images)
 */
export const uploadPropertyImages = upload.array('images', 10);

/**
 * Single image upload (for profile picture)
 */
export const uploadSingleImage = upload.single('image');