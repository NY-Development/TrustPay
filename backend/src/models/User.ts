import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { ALL_ROLES, ALL_PROVIDERS, Role, Provider, OWNER_STATUS, COMPANY_TYPES } from '../constants';

/* =========================================================
   INTERFACE
========================================================= */

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;

  accounts: {
    accountNumber: string;
    accountProvider: Provider;
  }[];

  ownerStatus: string;

  companyInfo?: {
    companyName: string;
    companyType: string;
    website?: string;
    country: string;
    region: string;
    city: string;
    address: string;
  };

  branches: mongoose.Types.ObjectId[];

  refreshToken?: string;
  tokenVersion: number;
  isActive: boolean;
  pushToken?: string;

  /* =========================
     TRIAL (REAL FIELDS)
  ========================= */

  trialStartDate?: Date;
  trialEndDate?: Date;
  hasUsedTrial: boolean;

  // ✅ REAL STORED FIELD (not virtual)
  daysLeft: number;

  createdAt: Date;
  updatedAt: Date;

  comparePassword(candidatePassword: string): Promise<boolean>;
}

/* =========================================================
   SCHEMA
========================================================= */

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    passwordHash: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },

    role: {
      type: String,
      enum: ALL_ROLES,
      default: 'OWNER',
    },

    accounts: [
      {
        accountNumber: { type: String, required: true },
        accountProvider: { type: String, enum: ALL_PROVIDERS, required: true },
      },
    ],

    ownerStatus: {
      type: String,
      enum: Object.values(OWNER_STATUS),
      default: 'PENDING_LICENSE',
    },

    companyInfo: {
      companyName: { type: String },
      companyType: { type: String, enum: Object.values(COMPANY_TYPES) },
      website: { type: String },
      country: { type: String },
      region: { type: String },
      city: { type: String },
      address: { type: String },
    },

    branches: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Branch',
      },
    ],

    refreshToken: { type: String, select: false },
    tokenVersion: { type: Number, default: 0 },

    isActive: { type: Boolean, default: true },
    pushToken: { type: String, default: null },

    /* =========================
       TRIAL FIELDS (REAL)
    ========================= */

    trialStartDate: { type: Date, default: null },
    trialEndDate: { type: Date, default: null },
    hasUsedTrial: { type: Boolean, default: false },

    // 🔥 STORED VALUE (UPDATED ON SAVE/ACCESS)
    daysLeft: { type: Number, default: 0 },
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

/* =========================================================
   INDEXES
========================================================= */

userSchema.index({ email: 1 });
userSchema.index({ ownerStatus: 1 });

/* =========================================================
   TRIAL CALCULATION (REAL FIELD UPDATE)
========================================================= */

userSchema.methods.calculateDaysLeft = function (): number {
  if (!this.trialEndDate) return 0;

  const diff = new Date(this.trialEndDate).getTime() - Date.now();
  return diff > 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 0;
};

/* =========================================================
   PRE-SAVE HOOK (IMPORTANT PART)
========================================================= */

userSchema.pre('save', function (next) {
  // update daysLeft every save
  if (this.trialEndDate) {
    const diff = new Date(this.trialEndDate).getTime() - Date.now();
    this.daysLeft = diff > 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 0;
  } else {
    this.daysLeft = 0;
  }

  next();
});

/* =========================================================
   PASSWORD HASH
========================================================= */

userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();

  const salt = await bcrypt.genSalt(12);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);

  next();
});

/* =========================================================
   METHODS
========================================================= */

userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

/* =========================================================
   EXPORT
========================================================= */

export const User = mongoose.model<IUser>('User', userSchema);