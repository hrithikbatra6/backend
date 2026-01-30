import express from 'express';
import { body } from 'express-validator';
import {
  createProperty,
  getAgentProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
  deletePropertyImage,
} from '../controllers/propertyController';
import { protect } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { uploadPropertyImages } from '../middleware/upload';

const router = express.Router();

/**
 * Validation rules for creating a property
 */
const createPropertyValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),

  body('locality')
    .trim()
    .notEmpty()
    .withMessage('Locality/area is required')
    .isLength({ max: 200 })
    .withMessage('Locality cannot exceed 200 characters'),

  body('price')
    .notEmpty()
    .withMessage('Price is required')
    .isNumeric()
    .withMessage('Price must be a number')
    .custom((value) => value >= 0)
    .withMessage('Price cannot be negative'),

  body('propertyType')
    .notEmpty()
    .withMessage('Property type is required')
    .isIn(['apartment', 'house', 'villa', 'plot', 'commercial', 'other'])
    .withMessage('Invalid property type'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),

  body('bedrooms')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Bedrooms must be a positive integer'),

  body('bathrooms')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Bathrooms must be a positive integer'),

  body('area')
    .optional()
    .isNumeric()
    .withMessage('Area must be a number')
    .custom((value) => value >= 0)
    .withMessage('Area cannot be negative'),
];

/**
 * Validation rules for updating a property
 */
const updatePropertyValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),

  body('locality')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Locality cannot exceed 200 characters'),

  body('price')
    .optional()
    .isNumeric()
    .withMessage('Price must be a number')
    .custom((value) => value >= 0)
    .withMessage('Price cannot be negative'),

  body('propertyType')
    .optional()
    .isIn(['apartment', 'house', 'villa', 'plot', 'commercial', 'other'])
    .withMessage('Invalid property type'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),

  body('bedrooms')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Bedrooms must be a positive integer'),

  body('bathrooms')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Bathrooms must be a positive integer'),

  body('area')
    .optional()
    .isNumeric()
    .withMessage('Area must be a number')
    .custom((value) => value >= 0)
    .withMessage('Area cannot be negative'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
];

// ==========================================
// PROPERTY ROUTES (All require authentication)
// ==========================================

/**
 * @route   POST /api/properties
 * @desc    Create a new property with images
 * @access  Private
 */
router.post(
  '/',
  protect,
  uploadPropertyImages, // Handle file upload
  createPropertyValidation,
  validate,
  createProperty
);

/**
 * @route   GET /api/properties
 * @desc    Get all properties of logged-in agent
 * @access  Private
 */
router.get('/', protect, getAgentProperties);

/**
 * @route   GET /api/properties/:id
 * @desc    Get single property by ID
 * @access  Private (Owner only)
 */
router.get('/:id', protect, getPropertyById);

/**
 * @route   PUT /api/properties/:id
 * @desc    Update a property
 * @access  Private (Owner only)
 */
router.put(
  '/:id',
  protect,
  uploadPropertyImages, // Can add new images
  updatePropertyValidation,
  validate,
  updateProperty
);

/**
 * @route   DELETE /api/properties/:id
 * @desc    Delete a property
 * @access  Private (Owner only)
 */
router.delete('/:id', protect, deleteProperty);

/**
 * @route   DELETE /api/properties/:id/images/:imageIndex
 * @desc    Delete a specific image from property
 * @access  Private (Owner only)
 */
router.delete('/:id/images/:imageIndex', protect, deletePropertyImage);

export default router;