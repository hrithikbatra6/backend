import { Response } from 'express';
import Property from '../models/Property';
import { AuthRequest } from '../middleware/auth';
import fs from 'fs';
import path from 'path';

/**
 * @route   POST /api/properties
 * @desc    Create a new property
 * @access  Private (Agent only)
 */
export const createProperty = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      title,
      description,
      locality,
      price,
      propertyType,
      bedrooms,
      bathrooms,
      area,
    } = req.body;

    // Get uploaded image files
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      res.status(400).json({
        success: false,
        message: 'At least one property image is required',
      });
      return;
    }

    // Generate image URLs
    const imageUrls = files.map(
      (file) => `${req.protocol}://${req.get('host')}/uploads/${file.filename}`
    );

    // Create property with agent ownership
    const property = await Property.create({
      title,
      description,
      locality,
      price,
      propertyType,
      bedrooms,
      bathrooms,
      area,
      images: imageUrls,
      agent: req.agent?.agentId, // Current logged-in agent
    });

    res.status(201).json({
      success: true,
      message: 'Property created successfully',
      data: { property },
    });
  } catch (error: any) {
    console.error('Create Property Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating property',
      error: error.message,
    });
  }
};

/**
 * @route   GET /api/properties
 * @desc    Get all properties of the logged-in agent
 * @access  Private
 */
export const getAgentProperties = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // Get only properties owned by the logged-in agent
    const properties = await Property.find({
      agent: req.agent?.agentId,
    }).sort({ createdAt: -1 }); // Newest first

    res.status(200).json({
      success: true,
      count: properties.length,
      data: { properties },
    });
  } catch (error: any) {
    console.error('Get Properties Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching properties',
      error: error.message,
    });
  }
};

/**
 * @route   GET /api/properties/:id
 * @desc    Get a single property by ID
 * @access  Private (Agent can only view their own property)
 */
export const getPropertyById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const property = await Property.findById(req.params.id).populate(
      'agent',
      'name email phone dealerName'
    );

    if (!property) {
      res.status(404).json({
        success: false,
        message: 'Property not found',
      });
      return;
    }

    // Check ownership - agent can only view their own properties
    if (property.agent._id.toString() !== req.agent?.agentId) {
      res.status(403).json({
        success: false,
        message: 'You do not have permission to view this property',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { property },
    });
  } catch (error: any) {
    console.error('Get Property Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching property',
      error: error.message,
    });
  }
};

/**
 * @route   PUT /api/properties/:id
 * @desc    Update a property
 * @access  Private (Owner only)
 */
export const updateProperty = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      res.status(404).json({
        success: false,
        message: 'Property not found',
      });
      return;
    }

    // Check ownership
    if (property.agent.toString() !== req.agent?.agentId) {
      res.status(403).json({
        success: false,
        message: 'You do not have permission to update this property',
      });
      return;
    }

    // Update fields
    const {
      title,
      description,
      locality,
      price,
      propertyType,
      bedrooms,
      bathrooms,
      area,
      isActive,
    } = req.body;

    if (title) property.title = title;
    if (description !== undefined) property.description = description;
    if (locality) property.locality = locality;
    if (price) property.price = price;
    if (propertyType) property.propertyType = propertyType;
    if (bedrooms !== undefined) property.bedrooms = bedrooms;
    if (bathrooms !== undefined) property.bathrooms = bathrooms;
    if (area !== undefined) property.area = area;
    if (isActive !== undefined) property.isActive = isActive;

    // Handle new images if uploaded
    const files = req.files as Express.Multer.File[];
    if (files && files.length > 0) {
      const newImageUrls = files.map(
        (file) => `${req.protocol}://${req.get('host')}/uploads/${file.filename}`
      );
      property.images = [...property.images, ...newImageUrls];
    }

    await property.save();

    res.status(200).json({
      success: true,
      message: 'Property updated successfully',
      data: { property },
    });
  } catch (error: any) {
    console.error('Update Property Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating property',
      error: error.message,
    });
  }
};

/**
 * @route   DELETE /api/properties/:id
 * @desc    Delete a property
 * @access  Private (Owner only)
 */
export const deleteProperty = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      res.status(404).json({
        success: false,
        message: 'Property not found',
      });
      return;
    }

    // Check ownership
    if (property.agent.toString() !== req.agent?.agentId) {
      res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this property',
      });
      return;
    }

    // Delete property images from file system
    property.images.forEach((imageUrl) => {
      const filename = path.basename(imageUrl);
      const filepath = path.join('uploads', filename);
      
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    });

    // Delete property from database
    await property.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Property deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete Property Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting property',
      error: error.message,
    });
  }
};

/**
 * @route   DELETE /api/properties/:id/images/:imageIndex
 * @desc    Delete a specific image from a property
 * @access  Private (Owner only)
 */
export const deletePropertyImage = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      res.status(404).json({
        success: false,
        message: 'Property not found',
      });
      return;
    }

    // Check ownership
    if (property.agent.toString() !== req.agent?.agentId) {
      res.status(403).json({
        success: false,
        message: 'You do not have permission to modify this property',
      });
      return;
    }

    // const imageIndex = parseInt(req.params.imageIndex);
    const imageIndex = parseInt(req.params.imageIndex as string);

    if (imageIndex < 0 || imageIndex >= property.images.length) {
      res.status(400).json({
        success: false,
        message: 'Invalid image index',
      });
      return;
    }

    // Delete image file
    const imageUrl = property.images[imageIndex];
    const filename = path.basename(imageUrl);
    const filepath = path.join('uploads', filename);

    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }

    // Remove from array
    property.images.splice(imageIndex, 1);
    await property.save();

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully',
      data: { property },
    });
  } catch (error: any) {
    console.error('Delete Image Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting image',
      error: error.message,
    });
  }
};