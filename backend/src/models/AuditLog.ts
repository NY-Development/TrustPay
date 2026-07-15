import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  action: string;
  actor: mongoose.Types.ObjectId; // References User (Owner/Admin) or Employee
  actorType: 'owner' | 'employee' | 'admin';
  branchId?: mongoose.Types.ObjectId;
  ip: string;
  deviceId?: string;
  appVersion?: string;
  userAgent: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    action: {
      type: String,
      required: true,
      index: true,
    },
    actor: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    actorType: {
      type: String,
      enum: ['owner', 'employee', 'admin'],
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
    ip: {
      type: String,
      default: 'unknown',
    },
    deviceId: {
      type: String,
      default: null,
    },
    appVersion: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: 'unknown',
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// TTL index: auto-delete audit logs after 90 days
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });
auditLogSchema.index({ actor: 1, action: 1, createdAt: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
