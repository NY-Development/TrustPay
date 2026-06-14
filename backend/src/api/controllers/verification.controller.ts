import { Request, Response } from 'express';
import { VerificationService } from '../../services/verification/verification.service';
import { OcrService } from '../../services/verification/ocr.service';
import { Verification } from '../../models/Verification';
import { AuditLog } from '../../models/AuditLog';
import { asyncHandler } from '../../utils/asyncHandler';
import { 
  BadRequestError, 
  ConflictError, 
  NotFoundError, 
  TooManyRequestsError 
} from '../../utils/AppError';
import { VerificationResult } from '../../types';
import { AUDIT_ACTIONS } from '../../constants';
import { logger } from '../../config/logger';

/**
 * @desc    Verify payment manually
 * @route   POST /api/v1/verifications/verify
 */
export const verifyManual = asyncHandler(async (req: Request, res: Response) => {
  const { provider, reference, suffix, accountSuffix, amountExpected, branchId } = req.body;
  const userId = req.user?.userId;

  // 1. Check for duplicate (Idempotency)
  const existing = await Verification.findOne({ transactionId: reference.toUpperCase() });
  if (existing) {
    throw new ConflictError('This transaction reference has already been verified.');
  }

  // 2. Perform Verification
  const result: VerificationResult = await VerificationService.verifyWithProvider({
    provider,
    reference,
    suffix,
    accountSuffix
  });

  if (!result.verified) {
    await logAudit(req, AUDIT_ACTIONS.VERIFY_PAYMENT_FAILED, { reference, provider, error: 'Provider reported invalid reference' });
    throw new BadRequestError('Payment verification failed. Invalid reference.');
  }

  // 3. Amount Validation
  if (amountExpected && result.amount < amountExpected) {
    throw new BadRequestError(`Amount mismatch. Expected: ${amountExpected}, Verified: ${result.amount}`);
  }

  // 4. Save and return
  const verification = await Verification.create({
    transactionId: result.transactionId.toUpperCase(),
    referenceNumber: result.referenceNumber || reference.toUpperCase(),
    provider: result.provider,
    amount: result.amount,
    currency: result.currency,
    payerName: result.payerName,
    paymentDate: result.paymentDate,
    verified: true,
    verifiedBy: userId,
    businessId: req.user?.businessId,
    branchId: branchId || req.user?.branchId,
    source: 'manual',
    rawResponse: result.raw,
    status: 'completed'
  });

  await logAudit(req, AUDIT_ACTIONS.VERIFY_PAYMENT, { verificationId: verification._id, reference });

  res.status(200).json({
    success: true,
    message: 'Transaction successfully verified',
    data: verification
  });
});

/**
 * @desc    Verify payment via universal reference parsing
 * @route   POST /api/v1/verifications/verify-universal
 */
export const verifyUniversal = asyncHandler(async (req: Request, res: Response) => {
  const { reference, suffix, phoneNumber, amountExpected, branchId } = req.body;
  
  const existing = await Verification.findOne({ transactionId: reference.toUpperCase() });
  if (existing) {
    throw new ConflictError('Transaction already processed.');
  }

  const result = await VerificationService.verifyUniversal({ reference, suffix, phoneNumber });

  if (!result.verified) {
    throw new BadRequestError('Could not locate reference.');
  }

  const verification = await Verification.create({
    transactionId: result.transactionId.toUpperCase(),
    provider: result.provider,
    amount: result.amount,
    currency: result.currency,
    payerName: result.payerName,
    paymentDate: result.paymentDate,
    verified: true,
    verifiedBy: req.user?.userId,
    businessId: req.user?.businessId,
    branchId: branchId || req.user?.branchId,
    source: 'qr',
    rawResponse: result.raw,
    status: 'completed'
  });

  res.status(200).json({ success: true, data: verification });
});

/**
 * @desc    Verify payment from OCR text (Screenshot)
 * @route   POST /api/v1/verifications/verify-ocr
 */
export const verifyOcr = asyncHandler(async (req: Request, res: Response) => {
  const { rawText, branchId, amountExpected } = req.body;

  // 1. Extract transaction info using OcrService (Regex -> AI)
  const extracted = await OcrService.extract(rawText);

  if (!extracted.transactionId) {
    throw new BadRequestError('Could not extract transaction ID from the text. Please enter manually.');
  }

  // 2. Proceed with verification
  const existing = await Verification.findOne({ transactionId: extracted.transactionId.toUpperCase() });
  if (existing) {
    throw new ConflictError('Transaction already processed.');
  }

  const result = await VerificationService.verifyWithProvider({
    provider: extracted.provider || VerificationService.detectProvider(extracted.transactionId),
    reference: extracted.transactionId
  });

  if (!result.verified) {
    throw new BadRequestError('Extracted reference is invalid or could not be verified.');
  }

  const verification = await Verification.create({
    transactionId: result.transactionId.toUpperCase(),
    provider: result.provider,
    amount: result.amount,
    currency: result.currency,
    payerName: result.payerName,
    paymentDate: result.paymentDate,
    verified: true,
    verifiedBy: req.user?.userId,
    businessId: req.user?.businessId,
    branchId: branchId || req.user?.branchId,
    source: 'screenshot',
    rawOcrText: rawText,
    rawResponse: result.raw,
    status: 'completed'
  });

  res.status(200).json({ success: true, data: verification, extracted });
});

/**
 * @desc    Get verification history
 * @route   GET /api/v1/verifications
 */
export const getVerifications = asyncHandler(async (req: Request, res: Response) => {
  const query: any = {};

  if (req.user?.role !== 'SUPER_ADMIN') {
    query.businessId = req.user?.businessId;
  }

  const verifications = await Verification.find(query).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: verifications
  });
});

// Helper for audit logging
async function logAudit(req: Request, action: string, metadata: any) {
  try {
    await AuditLog.create({
      action,
      actor: req.user?.userId,
      ip: req.ip,
      deviceId: req.headers['x-device-id'],
      appVersion: req.headers['x-app-version'],
      userAgent: req.headers['user-agent'],
      metadata
    });
  } catch (err) {
    logger.error('Failed to save audit log', err);
  }
}
