import mongoose, { Schema, Document } from 'mongoose';
import { ALL_PROVIDERS } from '../constants';

export interface IVerification extends Document {
  transactionId: string;
  referenceNumber?: string;
  provider: string;
  amount: number;
  currency: string;
  payerName: string;
  receiverName?: string;
  receiverAccount?: string;
  paymentDate: Date;
  verified: boolean;
  verifiedBy: mongoose.Types.ObjectId;
  branchId?: mongoose.Types.ObjectId;
  businessId?: mongoose.Types.ObjectId;
  source: string;
  rawOcrText?: string;
  rawResponse?: Record<string, unknown>;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const verificationSchema = new Schema<IVerification>(
  {
    transactionId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    referenceNumber: {
      type: String,
      trim: true,
      uppercase: true,
    },
    provider: {
      type: String,
      required: true,
      lowercase: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'ETB',
    },
    payerName: {
      type: String,
      default: 'Anonymous Payer',
    },
    receiverName: {
      type: String,
      default: null,
    },
    receiverAccount: {
      type: String,
      default: null,
    },
    paymentDate: {
      type: Date,
      required: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      default: null,
    },
    businessId: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      default: null,
    },
    source: {
      type: String,
      enum: ['screenshot', 'manual', 'qr'],
      default: 'manual',
    },
    rawOcrText: {
      type: String,
      default: null,
    },
    rawResponse: {
      type: Schema.Types.Mixed,
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Unique reference per provider to prevent replay attacks
verificationSchema.index({ transactionId: 1 }, { unique: true });
verificationSchema.index({ verifiedBy: 1, createdAt: -1 });
verificationSchema.index({ businessId: 1, createdAt: -1 });
verificationSchema.index({ branchId: 1, createdAt: -1 });

export const Verification = mongoose.model<IVerification>('Verification', verificationSchema);
