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
import { VerifiedTransaction } from '../../types';
import { AUDIT_ACTIONS } from '../../constants';
import { logger } from '../../config/logger';
import { NotificationService } from '../../services/notification.service';
import { User } from '../../models/User';

/**
 * @desc    Verify payment manually
 * @route   POST /api/v1/verifications/verify
 */
export const verifyManual = asyncHandler(async (req: Request, res: Response) => {
  const { reference, provider: clientProvider, amountExpected, branchId } = req.body;
  const userId = req.user?.userId;

  // 1. Check for duplicate (Idempotency)
  const existing = await Verification.findOne({ transactionId: reference.toUpperCase() });
  if (existing) {
    throw new ConflictError('This transaction reference has already been verified.');
  }

  // 2. Look up the verifier's account number for settlement matching
  const verifier = await User.findById(userId);
  const resolvedProvider = clientProvider || VerificationService.detectProvider(reference);
  const matchingAccount = verifier?.accounts?.find(acc => acc.accountProvider === resolvedProvider);
  if (!matchingAccount) {
    throw new BadRequestError(`No registered payment account found for provider '${resolvedProvider}'. Please register this provider in your settings.`);
  }

  const settlementAccount = matchingAccount.accountNumber;

  let derivedSuffix = '';
  if (resolvedProvider === 'cbe') {
    derivedSuffix = settlementAccount.length >= 8 ? settlementAccount.slice(-8) : settlementAccount;
  } else if (resolvedProvider === 'boa') {
    derivedSuffix = settlementAccount.length >= 5 ? settlementAccount.slice(-5) : settlementAccount;
  } else {
    derivedSuffix = settlementAccount.length >= 4 ? settlementAccount.slice(-4) : settlementAccount;
  }

  const derivedPhone = (resolvedProvider === 'cbebirr' || resolvedProvider === 'kaafiebirr') ? settlementAccount : undefined;

  // 3. Perform Verification via Verify.ET
  const result: VerifiedTransaction = await VerificationService.verifyWithProvider({
    provider: resolvedProvider,
    reference,
    suffix: derivedSuffix,
    accountSuffix: derivedSuffix,
    phoneNumber: derivedPhone,
    settlementAccount,
  });

  if (!result.verified) {
    await logAudit(req, AUDIT_ACTIONS.VERIFY_PAYMENT_FAILED, { reference, provider: resolvedProvider, error: 'Provider reported invalid reference' });
    throw new BadRequestError('Payment verification failed. Invalid reference.');
  }

  // 4. Settlement Account Match Check (from Verify.ET response)
  if (result.settlementAccountMatch && result.status !== 'success') {
    await logAudit(req, AUDIT_ACTIONS.VERIFY_PAYMENT_FAILED, {
      reference,
      provider: resolvedProvider,
      error: `Settlement account mismatch: ${result.settlementAccountMatch.reason}`,
      settlementAccountMatch: result.settlementAccountMatch,
    });
    throw new BadRequestError(
      `Settlement account mismatch. The payment was not sent to your registered account. Reason: ${result.settlementAccountMatch.reason}`
    );
  }

  // 5. Amount Validation
  if (amountExpected && result.amount < amountExpected) {
    throw new BadRequestError(`Amount mismatch. Expected: ${amountExpected}, Verified: ${result.amount}`);
  }

  // 6. Save and return
  const verification = await Verification.create({
    transactionId: result.referenceNumber.toUpperCase(),
    referenceNumber: result.referenceNumber.toUpperCase(),
    provider: result.bank,
    amount: result.amount,
    currency: result.currency,
    payerName: result.senderName,
    receiverName: result.receiverName,
    receiverAccount: result.bankSpecific?.receiverAccount || result.settlementAccountMatch?.receiverAccount,
    paymentDate: result.timestamp,
    verified: true,
    verifiedBy: userId,
    businessId: req.user?.businessId,
    branchId: branchId || req.user?.branchId,
    source: 'manual',
    rawResponse: result.raw,
    status: 'completed'
  });

  await logAudit(req, AUDIT_ACTIONS.VERIFY_PAYMENT, { verificationId: verification._id, reference });

  // Send Push Notification to the user who verified
  if (verifier?.pushToken) {
    NotificationService.sendNotification(
      verifier.pushToken,
      'Payment Verified',
      `Transaction ${result.referenceNumber} of ${result.amount} ${result.currency} was successful.`
    ).catch(err => logger.error('Push notification failed', err));
  }

  res.status(200).json({
    success: true,
    message: 'Transaction successfully verified',
    data: verification
  });
});

/**
 * @desc    Verify payment from OCR text (Screenshot)
 * @route   POST /api/v1/verifications/verify-ocr
 */
export const verifyOcr = asyncHandler(async (req: Request, res: Response) => {
  const { rawText, branchId, amountExpected } = req.body;
  const userId = req.user?.userId;

  // 1. Extract transaction info using OcrService (Regex -> AI)
  const extracted = await OcrService.extract(rawText);

  if (!extracted.transactionId) {
    throw new BadRequestError('Could not extract transaction ID from the text. Please enter manually.');
  }

  // 2. Check for duplicate
  const existing = await Verification.findOne({ transactionId: extracted.transactionId.toUpperCase() });
  if (existing) {
    throw new ConflictError('Transaction already processed.');
  }

  // 3. Look up the verifier's account number for settlement matching
  const verifier = await User.findById(userId);
  const detectedProvider = extracted.provider || VerificationService.detectProvider(extracted.transactionId);
  const matchingAccount = verifier?.accounts?.find(acc => acc.accountProvider === detectedProvider);
  const settlementAccount = matchingAccount?.accountNumber || verifier?.accounts?.[0]?.accountNumber;

  if (!settlementAccount) {
    throw new BadRequestError('No registered payment account found. Please register at least one payment account in your settings.');
  }

  const resolvedProvider = matchingAccount?.accountProvider || detectedProvider;

  let derivedSuffix = '';
  if (resolvedProvider === 'cbe') {
    derivedSuffix = settlementAccount.length >= 8 ? settlementAccount.slice(-8) : settlementAccount;
  } else if (resolvedProvider === 'boa') {
    derivedSuffix = settlementAccount.length >= 5 ? settlementAccount.slice(-5) : settlementAccount;
  } else {
    derivedSuffix = settlementAccount.length >= 4 ? settlementAccount.slice(-4) : settlementAccount;
  }

  const derivedPhone = (resolvedProvider === 'cbebirr' || resolvedProvider === 'kaafiebirr') ? settlementAccount : undefined;

  // 4. Perform Verification via Verify.ET
  const result = await VerificationService.verifyWithProvider({
    provider: resolvedProvider,
    reference: extracted.transactionId,
    suffix: derivedSuffix,
    accountSuffix: derivedSuffix,
    phoneNumber: derivedPhone,
    settlementAccount
  });

  if (!result.verified) {
    throw new BadRequestError('Extracted reference is invalid or could not be verified.');
  }

  // 5. Settlement Account Match Check
  if (result.settlementAccountMatch && !result.settlementAccountMatch.matched) {
    throw new BadRequestError(
      `Settlement account mismatch. Reason: ${result.settlementAccountMatch.reason}`
    );
  }

  // 6. Save and return
  const verification = await Verification.create({
    transactionId: result.referenceNumber.toUpperCase(),
    referenceNumber: result.referenceNumber.toUpperCase(),
    provider: result.bank,
    amount: result.amount,
    currency: result.currency,
    payerName: result.senderName,
    receiverName: result.receiverName,
    receiverAccount: result.bankSpecific?.receiverAccount || result.settlementAccountMatch?.receiverAccount,
    paymentDate: result.timestamp,
    verified: true,
    verifiedBy: userId,
    businessId: req.user?.businessId,
    branchId: branchId || req.user?.branchId,
    source: 'screenshot',
    rawOcrText: rawText,
    rawResponse: result.raw,
    status: 'completed'
  });

  // Send Push Notification
  if (verifier?.pushToken) {
    NotificationService.sendNotification(
      verifier.pushToken,
      'OCR Verification Success',
      `Transaction ${result.referenceNumber} verified for ${result.amount} ${result.currency}.`
    ).catch(err => logger.error('Push notification failed', err));
  }

  res.status(200).json({ success: true, data: verification, extracted });
});

/**
 * @desc    Get verification history for current user's business
 * @route   GET /api/v1/verifications/business-history
 */
export const getBusinessVerifications = asyncHandler(async (req: Request, res: Response) => {
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

/**
 * @desc    Get verification history for the authenticated user only
 * @route   GET /api/v1/verifications/my-history
 */
export const getMyVerifications = asyncHandler(async (req: Request, res: Response) => {
  const verifications = await Verification.find({
    verifiedBy: req.user?.userId
  }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: verifications
  });
});

/**
 * @desc    Get verification details by ID
 * @route   GET /api/v1/verifications/:id
 */
export const getVerificationById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const query: any = { _id: id };

  if (req.user?.role !== 'SUPER_ADMIN') {
    query.businessId = req.user?.businessId;
  }

  const verification = await Verification.findOne(query);

  if (!verification) {
    throw new NotFoundError('Verification record not found.');
  }

  res.status(200).json({
    success: true,
    data: verification
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