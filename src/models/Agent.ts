import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * Agent Interface - TypeScript type definition
 */
export interface IAgent extends Document {
  name: string;
  email: string;
  password: string;
  phone: string;
  dealerName?: string;
  profileImage?: string;
  role: 'agent' | 'admin';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

/**
 * Agent Schema - MongoDB structure
 */
const AgentSchema = new Schema<IAgent>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number'],
    },
    dealerName: {
      type: String,
      trim: true,
      maxlength: [100, 'Dealer name cannot exceed 100 characters'],
    },
    profileImage: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ['agent', 'admin'],
      default: 'agent',
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
 * Pre-save middleware - Hash password before saving
 */
AgentSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

/**
 * Method to compare passwords
 */
AgentSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

// AgentSchema.index({ email: 1 });
// AgentSchema.index({ phone: 1 });

export default mongoose.model<IAgent>('Agent', AgentSchema);