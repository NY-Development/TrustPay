import mongoose, { Schema, Document } from 'mongoose';
import { ALL_PROVIDERS, Provider, COMPANY_TYPES, CompanyType, BRANCH_TYPE_PREFIXES } from '../constants';

export interface IBranch extends Document {
  ownerId: mongoose.Types.ObjectId;
  branchName: string;
  branchCode: string;
  branchNumber: number;
  country: string;
  region: string;
  city: string;
  subCity?: string;
  wereda?: string;
  kebele?: string;
  address: string;
  latitude?: number;
  longitude?: number;
  phone: string;
  email: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  accounts: {
    accountNumber: string;
    accountProvider: Provider;
  }[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const branchSchema = new Schema<IBranch>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner ID is required'],
    },
    branchName: {
      type: String,
      required: [true, 'Branch name is required'],
      trim: true,
    },
    branchCode: {
      type: String,
      unique: true,
      trim: true,
    },
    branchNumber: {
      type: Number,
      default: 1,
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      default: 'Ethiopia',
      trim: true,
    },
    region: {
      type: String,
      required: [true, 'Region is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    subCity: {
      type: String,
      default: '',
      trim: true,
    },
    wereda: {
      type: String,
      default: '',
      trim: true,
    },
    kebele: {
      type: String,
      default: '',
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Address specification is required'],
      trim: true,
    },
    latitude: {
      type: Number,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
      default: 'ACTIVE',
    },
    accounts: [
      {
        accountNumber: { type: String, required: true },
        accountProvider: { type: String, enum: ALL_PROVIDERS, required: true },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance and uniqueness
branchSchema.index({ branchCode: 1 }, { unique: true });
branchSchema.index({ ownerId: 1 });
branchSchema.index({ ownerId: 1, branchName: 1 }, { unique: true });

// Pre-save hook: auto-generate short branchCode from Owner's company type
branchSchema.pre('save', async function (next) {
  if (!this.isNew || this.branchCode) return next();

  try {
    const User = mongoose.model('User');
    const owner = await User.findById(this.ownerId);
    const companyType = (owner?.companyInfo?.companyType || 'OTHER') as CompanyType;
    const prefix = BRANCH_TYPE_PREFIXES[companyType] || 'BRN';

    const count = await mongoose.model('Branch').countDocuments({ ownerId: this.ownerId });
    this.branchNumber = count + 1;
    const codeNumber = String(this.branchNumber).padStart(3, '0');
    this.branchCode = `${prefix}-${codeNumber}`;
    next();
  } catch (err: any) {
    next(err);
  }
});

export const Branch = mongoose.model<IBranch>('Branch', branchSchema);
