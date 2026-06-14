import mongoose, { Schema, Document } from 'mongoose';

export interface IBusiness extends Document {
  name: string;
  logo?: string;
  industry: string;
  subscription: {
    tier: string;
    status: string;
    expiresAt?: Date;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const businessSchema = new Schema<IBusiness>(
  {
    name: {
      type: String,
      required: [true, 'Business name is required'],
      trim: true,
      unique: true,
    },
    logo: {
      type: String,
      default: null,
    },
    industry: {
      type: String,
      required: [true, 'Industry is required'],
      enum: ['restaurant', 'cafe', 'supermarket', 'pharmacy', 'retail', 'other'],
    },
    subscription: {
      tier: {
        type: String,
        enum: ['free', 'basic', 'pro', 'enterprise'],
        default: 'free',
      },
      status: {
        type: String,
        enum: ['active', 'expired', 'cancelled'],
        default: 'active',
      },
      expiresAt: {
        type: Date,
        default: null,
      },
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

export const Business = mongoose.model<IBusiness>('Business', businessSchema);
