import mongoose, { Schema, Document } from 'mongoose';

/* ============================================================
   ENUMS
============================================================ */

export type VerificationSource =
  | 'manual'
  | 'qr'
  | 'ocr'
  | 'screenshot';

export type VerificationStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed';

export type VerificationSeverity =
  | 'success'
  | 'info'
  | 'warning'
  | 'duplicate'
  | 'fraud_risk'
  | 'error';

/* ============================================================
   SUB DOCUMENTS
============================================================ */

const VerificationSummarySchema = new Schema(
  {
    severity: String,
    title: String,
    description: String,
  },
  { _id: false }
);

const VerificationResultSchema = new Schema(
  {
    bankSpecific: Schema.Types.Mixed,

    settlementAccountMatch: Schema.Types.Mixed,

    confirmationHistory: Schema.Types.Mixed,
  },
  { _id: false }
);

/* ============================================================
   DOCUMENT
============================================================ */

export interface IVerification extends Document {
  transactionId: string;

  referenceNumber: string;

  requestId: string;

  bank: string;

  provider: string;

  amount: number;

  currency: string;

  senderName: string;

  receiverName: string;

  receiverAccount: string;

  accountSuffix: string;

  paymentDate: Date;

  verified: boolean;

  processingStatus: VerificationStatus;

  verificationStatus: string;

  source: VerificationSource;

  verificationSummary: {
    severity: VerificationSeverity;
    title: string;
    description: string;
  };

  verificationResult: {
    bankSpecific: Record<string, unknown>;

    settlementAccountMatch: Record<string, unknown>;

    confirmationHistory: Record<string, unknown>;
  };

  providerResponse: Record<string, unknown>;

  rawOcrText?: string;

  verifiedBy: mongoose.Types.ObjectId;

  verifiedByType: 'owner' | 'employee';

  branchId: mongoose.Types.ObjectId;

  createdAt: Date;

  updatedAt: Date;
}

const verificationSchema = new Schema<IVerification>(
{
    transactionId:{
        type:String,
        required:true,
        uppercase:true,
        trim:true
    },

    referenceNumber:{
        type:String,
        required:true,
        uppercase:true,
        trim:true
    },

    requestId:{
        type:String,
        required:true,
        index:true
    },

    bank:{
        type:String,
        required:true,
        lowercase:true
    },

    provider:{
        type:String,
        required:true,
        lowercase:true
    },

    amount:{
        type:Number,
        required:true
    },

    currency:{
        type:String,
        default:"ETB"
    },

    senderName:String,

    receiverName:String,

    receiverAccount:String,

    accountSuffix:String,

    paymentDate:{
        type:Date,
        required:true
    },

    verified:{
        type:Boolean,
        default:false
    },

    processingStatus:{
        type:String,
        enum:[
            "pending",
            "processing",
            "completed",
            "failed"
        ],
        default:"processing"
    },

    verificationStatus:{
        type:String,
        default:"success"
    },

    source:{
        type:String,
        enum:[
            "manual",
            "qr",
            "ocr",
            "screenshot"
        ]
    },

    verificationSummary:{
        type:VerificationSummarySchema,
        required:true
    },

    verificationResult:{
        type:VerificationResultSchema,
        required:true
    },

    providerResponse:{
        type:Schema.Types.Mixed
    },

    rawOcrText:String,

    verifiedBy:{
        type:Schema.Types.ObjectId,
        required:true
    },

    verifiedByType:{
        type:String,
        enum:['owner', 'employee'],
        required:true,
        default:'owner'
    },

    branchId:{
        type:Schema.Types.ObjectId,
        ref:"Branch",
        required:true
    }

},
{
    timestamps:true
});

verificationSchema.index(
{
    transactionId:1
},
{
    unique:true
});

verificationSchema.index({
    requestId:1
});

verificationSchema.index({
    branchId:1,
    createdAt:-1
});

verificationSchema.index({
    verifiedBy:1,
    createdAt:-1
});

verificationSchema.index({
    "verificationSummary.severity":1
});

verificationSchema.index({
    verified:1
});

verificationSchema.index({
    processingStatus:1
});

export const Verification = mongoose.model<IVerification>(
    "Verification",
    verificationSchema
);