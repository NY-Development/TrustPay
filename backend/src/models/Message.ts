import mongoose, { Schema, Document } from 'mongoose';
import { MESSAGE_TYPES, MessageType } from '../constants';

export interface IMessage extends Document {
  senderId: mongoose.Types.ObjectId; // Owner (User)
  branchId?: mongoose.Types.ObjectId; // Optional - null for company-wide
  recipientIds?: mongoose.Types.ObjectId[]; // Optional - list of individual employees
  recipientType: 'INDIVIDUAL' | 'BRANCH' | 'COMPANY';
  messageType: MessageType;
  title: string;
  body: string;
  readBy: mongoose.Types.ObjectId[]; // Employee IDs who have marked this read
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender ID (Owner) is required'],
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      default: null,
    },
    recipientIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Employee',
      },
    ],
    recipientType: {
      type: String,
      enum: ['INDIVIDUAL', 'BRANCH', 'COMPANY'],
      required: [true, 'Recipient type is required'],
    },
    messageType: {
      type: String,
      enum: Object.values(MESSAGE_TYPES),
      required: [true, 'Message type is required'],
    },
    title: {
      type: String,
      required: [true, 'Message title is required'],
      trim: true,
    },
    body: {
      type: String,
      required: [true, 'Message body is required'],
      trim: true,
    },
    readBy: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Employee',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes
messageSchema.index({ senderId: 1 });
messageSchema.index({ branchId: 1, createdAt: -1 });
messageSchema.index({ recipientIds: 1 });

export const Message = mongoose.model<IMessage>('Message', messageSchema);
