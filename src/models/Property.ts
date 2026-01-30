import mongoose, { Document, Schema } from 'mongoose';

/**
 * Property Interface - TypeScript type definition
 */
export interface IProperty extends Document {
  title: string;
  description?: string;
  locality: string; // Area/locality (not full address)
  price: number;
  propertyType: 'apartment' | 'house' | 'villa' | 'plot' | 'commercial' | 'other';
  bedrooms?: number;
  bathrooms?: number;
  area?: number; // in sq ft
  images: string[]; // Array of image URLs
  agent: mongoose.Types.ObjectId; // Reference to Agent who owns this property
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Property Schema - MongoDB structure
 */
const PropertySchema = new Schema<IProperty>(
  {
    title: {
      type: String,
      required: [true, 'Property title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    locality: {
      type: String,
      required: [true, 'Locality/area is required'],
      trim: true,
      maxlength: [200, 'Locality cannot exceed 200 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    propertyType: {
      type: String,
      required: [true, 'Property type is required'],
      enum: {
        values: ['apartment', 'house', 'villa', 'plot', 'commercial', 'other'],
        message: 'Invalid property type',
      },
    },
    bedrooms: {
      type: Number,
      min: [0, 'Bedrooms cannot be negative'],
    },
    bathrooms: {
      type: Number,
      min: [0, 'Bathrooms cannot be negative'],
    },
    area: {
      type: Number,
      min: [0, 'Area cannot be negative'],
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: function (images: string[]) {
          return images.length <= 10; // Max 10 images per property
        },
        message: 'A property cannot have more than 10 images',
      },
    },
    agent: {
      type: Schema.Types.ObjectId,
      ref: 'Agent',
      required: [true, 'Agent reference is required'],
      index: true, // Index for faster queries
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Indexes for better query performance
 */
PropertySchema.index({ agent: 1, createdAt: -1 }); // Get agent's properties sorted by date
PropertySchema.index({ locality: 1 });
PropertySchema.index({ propertyType: 1 });
PropertySchema.index({ price: 1 });

export default mongoose.model<IProperty>('Property', PropertySchema);