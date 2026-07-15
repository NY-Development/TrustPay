import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES, Role } from '../constants';

const EMPLOYEE_ROLES = [
  ROLES.MANAGER,
  ROLES.CASHIER,
  ROLES.VERIFIER,
  ROLES.RECEPTIONIST,
  ROLES.OTHER
];

export interface IEmployee extends Document {
  ownerId: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  pushToken?: string;
  refreshToken?: string;
  tokenVersion: number;
  lastLogin?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  comparePassword(candidatePassword: string): Promise<boolean>;
}

const employeeSchema = new Schema<IEmployee>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner ID is required'],
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Branch ID is required'],
    },
    name: {
      type: String,
      required: [true, 'Employee name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Employee email is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
    },
    role: {
      type: String,
      enum: EMPLOYEE_ROLES,
      required: [true, 'Employee role is required'],
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
      default: 'ACTIVE',
    },
    pushToken: {
      type: String,
      default: null,
    },
    refreshToken: {
      type: String,
      select: false,
    },
    tokenVersion: {
      type: Number,
      default: 0,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: any) {
        delete ret.passwordHash;
        delete ret.refreshToken;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
employeeSchema.index({ email: 1 }, { unique: true });
employeeSchema.index({ branchId: 1 });
employeeSchema.index({ ownerId: 1 });

// Password hashing hook
employeeSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (err: any) {
    next(err);
  }
});

// Compare password method
employeeSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

export const Employee = mongoose.model<IEmployee>('Employee', employeeSchema);
