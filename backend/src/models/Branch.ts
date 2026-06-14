import mongoose, { Schema, Document } from 'mongoose';

export interface IBranch extends Document {
  businessId: mongoose.Types.ObjectId;
  name: string;
  address: string;
  city: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const branchSchema = new Schema<IBranch>(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      required: [true, 'Business ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Branch name is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    city: {
      type: String,
      default: '',
      trim: true,
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

// Compound index : unique branch name per business
branchSchema.index({ businessId: 1, name: 1 }, { unique: true });

export const Branch = mongoose.model<IBranch>('Branch', branchSchema);
