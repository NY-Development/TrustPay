import mongoose, { Schema, Document } from 'mongoose';
import { NOTIFICATION_CATEGORIES, NotificationCategory } from '../constants';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId; // References Owner (User) or Employee
  recipientType: 'owner' | 'employee';
  branchId?: mongoose.Types.ObjectId; // Optional link to branch
  auditLogId?: mongoose.Types.ObjectId; // Optional link back to technical footprint
  title: string;
  body: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  category: NotificationCategory;
  channels: ('push' | 'in_app' | 'email')[];
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    recipientType: {
      type: String,
      enum: ['owner', 'employee'],
      required: true,
      default: 'owner',
      index: true,
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      index: true,
      default: null,
    },
    auditLogId: {
      type: Schema.Types.ObjectId,
      ref: 'AuditLog',
      default: null,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['info', 'success', 'warning', 'error'],
      default: 'info',
    },
    category: {
      type: String,
      enum: Object.values(NOTIFICATION_CATEGORIES),
      required: true,
      default: 'SYSTEM',
      index: true,
    },
    channels: [
      {
        type: String,
        enum: ['push', 'in_app', 'email'],
      },
    ],
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Optimize query performance for individual user lists
NotificationSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<INotification>('Notification', NotificationSchema);