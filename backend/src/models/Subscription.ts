import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscription extends Document {
  branchId: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  plan: 'monthly' | 'yearly';
  amount: number;
  currency: string;
  transactionId: string;
  payerName: string;
  receiverName: string;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'expired' | 'pending' | 'partial_payment';
  paidAmount: number;
  requiredAmount: number;
  fullyPaid: boolean;
  verificationId?: mongoose.Types.ObjectId;
  topUpVerificationIds: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new Schema<ISubscription>(
  {
    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    plan: {
      type: String,
      enum: ['monthly', 'yearly'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'ETB',
    },
    transactionId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    payerName: {
      type: String,
      required: true,
      trim: true,
    },
    receiverName: {
      type: String,
      required: true,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'pending', 'partial_payment'],
      default: 'active',
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    requiredAmount: {
      type: Number,
      default: 0,
    },
    fullyPaid: {
      type: Boolean,
      default: false,
    },
    topUpVerificationIds: [{
      type: Schema.Types.ObjectId,
      ref: 'Verification',
    }],
    verificationId: {
      type: Schema.Types.ObjectId,
      ref: 'Verification',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

subscriptionSchema.index({ branchId: 1, status: 1 });
subscriptionSchema.index({ ownerId: 1 });
subscriptionSchema.index({ transactionId: 1 }, { unique: true });

export const Subscription = mongoose.model<ISubscription>('Subscription', subscriptionSchema);
